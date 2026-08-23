use std::io::{Cursor, Read};

use futures_util::StreamExt;
use rusqlite::{params, Connection};
use tauri::{AppHandle, Emitter};

use crate::catalog;
use crate::model::{InstallProgress, Translation};

pub const PROGRESS_EVENT: &str = "bible-point://install-progress";

fn report(app: &AppHandle, translation_id: &str, phase: &str, percent: u8, message: Option<&str>) {
    let _ = app.emit(
        PROGRESS_EVENT,
        InstallProgress {
            translation_id: translation_id.to_string(),
            phase: phase.to_string(),
            percent,
            message: message.map(str::to_string),
        },
    );
}

/// Builds a progress callback that emits to the frontend.
pub fn emitter<'a>(app: &'a AppHandle, translation_id: &'a str) -> impl Fn(&str, u8) + 'a {
    move |phase, percent| report(app, translation_id, phase, percent, None)
}

/// Downloads a translation's verse-per-line archive, reporting real byte progress.
pub async fn download(app: &AppHandle, translation_id: &str) -> Result<Vec<u8>, String> {
    let response = catalog::http_client()?
        .get(catalog::pack_url(translation_id))
        .send()
        .await
        .map_err(|e| format!("gagal mengunduh: {e}"))?
        .error_for_status()
        .map_err(|e| format!("berkas tidak tersedia di server: {e}"))?;

    let total = response.content_length();
    let mut bytes = Vec::with_capacity(total.unwrap_or(4 << 20) as usize);
    let mut stream = response.bytes_stream();
    let mut last_reported = 0u8;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("unduhan terputus: {e}"))?;
        bytes.extend_from_slice(&chunk);

        // Without a Content-Length the percentage would be a guess, so hold at
        // zero and let the phase label carry the "still working" signal.
        if let Some(total) = total.filter(|t| *t > 0) {
            let percent = ((bytes.len() as u64 * 100) / total).min(100) as u8;
            // One event per whole percent; per-chunk emits would flood the UI.
            if percent > last_reported {
                last_reported = percent;
                report(app, translation_id, "downloading", percent, None);
            }
        }
    }

    Ok(bytes)
}

/// Reads verse-per-line text from a file the operator supplied directly.
///
/// Sideloading is the legitimate route for translations the catalog does not
/// carry — a church's own licensed copy, or a text with no online distribution
/// at all. Both shapes people actually have are accepted: an eBible-style zip,
/// or the plain verse-per-line text on its own.
pub fn read_local_pack(bytes: &[u8], file_name: &str) -> Result<String, String> {
    // Zip archives begin with the local file header signature "PK\x03\x04";
    // sniffing the contents is more reliable than trusting the file extension.
    let is_zip = bytes.starts_with(b"PK\x03\x04");

    if is_zip {
        return extract_vpl(bytes, file_name);
    }

    let text = String::from_utf8_lossy(bytes).into_owned();
    if text.trim().is_empty() {
        return Err("berkas kosong".into());
    }
    Ok(text)
}

/// Pulls the verse-per-line text out of the downloaded archive.
///
/// eBible packs the same text in several formats; the `.txt` member is the
/// verse-per-line one, and it is the only member this app reads.
pub fn extract_vpl(archive: &[u8], translation_id: &str) -> Result<String, String> {
    let mut zip = zip::ZipArchive::new(Cursor::new(archive))
        .map_err(|e| format!("arsip rusak: {e}"))?;

    let names: Vec<String> = (0..zip.len())
        .filter_map(|i| zip.by_index(i).ok().map(|f| f.name().to_string()))
        .collect();

    // Prefer eBible's own naming; fall back to any .txt so a zip assembled by
    // hand still works when someone sideloads one.
    let name = names
        .iter()
        .find(|n| n.ends_with("_vpl.txt") || *n == &format!("{translation_id}.txt"))
        .or_else(|| names.iter().find(|n| n.to_ascii_lowercase().ends_with(".txt")))
        .cloned()
        .ok_or_else(|| "arsip tidak memuat berkas teks verse-per-line".to_string())?;

    let mut file = zip.by_name(&name).map_err(|e| format!("gagal membuka {name}: {e}"))?;
    let mut raw = Vec::new();
    file.read_to_end(&mut raw).map_err(|e| format!("gagal membaca {name}: {e}"))?;

    Ok(String::from_utf8_lossy(&raw).into_owned())
}

/// One parsed line of verse-per-line text.
pub struct ParsedVerse<'a> {
    pub book_id: &'a str,
    pub chapter: i64,
    pub verse: i64,
    pub text: &'a str,
}

/// Translates eBible's book codes into the USFM codes the rest of the app uses.
///
/// eBible diverges from USFM for eleven books. Storing its codes unchanged
/// would make John, Philippians, Mark and James unreachable — the frontend
/// looks them up as JHN, PHP, MRK, JAS — so normalisation happens here, at the
/// only point where foreign codes enter the system. Everything downstream of
/// the database speaks USFM and nothing else.
fn canonical_book_id(code: &str) -> &str {
    match code {
        "SOL" => "SNG",
        "EZE" => "EZK",
        "JOE" => "JOL",
        "NAH" => "NAM",
        "MAR" => "MRK",
        "JOH" => "JHN",
        "PHI" => "PHP",
        "JAM" => "JAS",
        "1JO" => "1JN",
        "2JO" => "2JN",
        "3JO" => "3JN",
        other => other,
    }
}

/// Parses `BOOK C:V text` lines, skipping anything that does not match.
///
/// Real files carry blank lines and the occasional verse with empty text (a
/// verse number present in the versification but absent from this translation);
/// both are dropped rather than stored as empty rows the operator could project.
pub fn parse_vpl(body: &str) -> Vec<ParsedVerse<'_>> {
    let mut out = Vec::with_capacity(32_000);

    for line in body.lines() {
        let line = line.trim_end_matches('\r');

        // "GEN 1:1 In the beginning..." — book, then chapter:verse, then the
        // rest of the line, which may itself contain spaces and colons.
        let Some((book_id, rest)) = line.split_once(' ') else { continue };
        if book_id.len() != 3 || !book_id.bytes().all(|b| b.is_ascii_alphanumeric()) {
            continue;
        }

        let Some((chapter_verse, text)) = rest.split_once(' ') else { continue };
        let Some((c, v)) = chapter_verse.split_once(':') else { continue };
        let (Ok(chapter), Ok(verse)) = (c.parse::<i64>(), v.parse::<i64>()) else { continue };

        let text = text.trim();
        if text.is_empty() {
            continue;
        }

        out.push(ParsedVerse { book_id: canonical_book_id(book_id), chapter, verse, text });
    }

    out
}

/// Writes a parsed translation into the database, replacing any earlier copy.
///
/// Progress is delivered through a callback rather than an `AppHandle` so the
/// whole import path can be exercised by a test with no Tauri runtime present.
pub fn import(
    on_progress: &dyn Fn(&str, u8),
    conn: &mut Connection,
    meta: &Translation,
    verses: &[ParsedVerse<'_>],
    size_bytes: i64,
) -> Result<i64, String> {
    on_progress("importing", 0);

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    // Reinstalling must not double the rows, and the FTS index is keyed by the
    // rowids we are about to delete, so it has to be cleared first.
    tx.execute(
        "DELETE FROM verses_fts WHERE rowid IN (SELECT id FROM verses WHERE translation_id = ?1)",
        params![meta.id],
    )
    .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM verses WHERE translation_id = ?1", params![meta.id])
        .map_err(|e| e.to_string())?;

    tx.execute(
        "INSERT INTO translations
            (id, name, abbrev, language, language_name, license, year,
             verse_count, size_bytes, source_url, installed_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10, strftime('%s','now'))
         ON CONFLICT(id) DO UPDATE SET
            name=excluded.name, abbrev=excluded.abbrev, language=excluded.language,
            language_name=excluded.language_name, license=excluded.license,
            year=excluded.year, verse_count=excluded.verse_count,
            size_bytes=excluded.size_bytes, source_url=excluded.source_url,
            installed_at=excluded.installed_at",
        params![
            meta.id, meta.name, meta.abbrev, meta.language, meta.language_name,
            meta.license, meta.year, verses.len() as i64, size_bytes, meta.source_url
        ],
    )
    .map_err(|e| e.to_string())?;

    {
        let mut stmt = tx
            .prepare(
                "INSERT INTO verses (translation_id, book_id, chapter, verse, text)
                 VALUES (?1,?2,?3,?4,?5)",
            )
            .map_err(|e| e.to_string())?;

        let step = (verses.len() / 20).max(1);
        for (i, v) in verses.iter().enumerate() {
            stmt.execute(params![meta.id, v.book_id, v.chapter, v.verse, v.text])
                .map_err(|e| e.to_string())?;
            if i % step == 0 {
                let percent = ((i * 100) / verses.len().max(1)).min(100) as u8;
                on_progress("importing", percent);
            }
        }
    }

    // Building the index once after the bulk insert is far cheaper than keeping
    // it in step through triggers on every one of ~31,000 rows.
    on_progress("indexing", 0);
    tx.execute(
        "INSERT INTO verses_fts(rowid, text)
         SELECT id, text FROM verses WHERE translation_id = ?1",
        params![meta.id],
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    on_progress("done", 100);

    Ok(verses.len() as i64)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_well_formed_lines() {
        let body = "GEN 1:1 Pada mulanya, Allah menciptakan langit dan bumi.\n\
                    REV 22:21 Anugerah Tuhan Yesus menyertai kamu semua. Amin.\n";
        let out = parse_vpl(body);
        assert_eq!(out.len(), 2);
        assert_eq!(out[0].book_id, "GEN");
        assert_eq!((out[0].chapter, out[0].verse), (1, 1));
        assert_eq!(out[1].book_id, "REV");
        assert_eq!((out[1].chapter, out[1].verse), (22, 21));
        assert!(out[1].text.starts_with("Anugerah"));
    }

    #[test]
    fn skips_blank_and_malformed_lines() {
        let body = "\nGEN 1:1 Ada isinya.\nnot a reference at all\nGEN 1:2 \nPSA 23:1 Tuhanlah Gembalaku.\n";
        let out = parse_vpl(body);
        assert_eq!(out.len(), 2);
        assert_eq!(out[0].book_id, "GEN");
        assert_eq!(out[1].book_id, "PSA");
    }

    #[test]
    fn keeps_colons_inside_verse_text() {
        let out = parse_vpl("JOH 3:16 Karena begini: Allah mengasihi dunia.\n");
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].text, "Karena begini: Allah mengasihi dunia.");
    }

    /// Builds a minimal zip in memory so the sideload path can be tested
    /// without a fixture file on disk.
    fn zip_with(name: &str, body: &str) -> Vec<u8> {
        use std::io::Write;
        let mut buffer = Cursor::new(Vec::new());
        {
            let mut writer = zip::ZipWriter::new(&mut buffer);
            writer
                .start_file(name, zip::write::SimpleFileOptions::default())
                .unwrap();
            writer.write_all(body.as_bytes()).unwrap();
            writer.finish().unwrap();
        }
        buffer.into_inner()
    }

    #[test]
    fn reads_a_sideloaded_plain_text_file() {
        let body = "JOH 3:16 Karena Allah mengasihi dunia.
";
        let text = read_local_pack(body.as_bytes(), "tb.txt").unwrap();
        let verses = parse_vpl(&text);
        assert_eq!(verses.len(), 1);
        assert_eq!(verses[0].book_id, "JHN");
    }

    #[test]
    fn reads_a_sideloaded_zip_by_sniffing_its_contents() {
        // Deliberately not named *_vpl.txt, and the archive extension is wrong,
        // because operators hand over whatever they happen to have.
        let archive = zip_with("my-bible.txt", "PHI 4:13 Segala perkara dapat kutanggung.
");
        let text = read_local_pack(&archive, "whatever.dat").unwrap();
        let verses = parse_vpl(&text);
        assert_eq!(verses.len(), 1);
        assert_eq!(verses[0].book_id, "PHP");
    }

    #[test]
    fn rejects_an_empty_sideload() {
        assert!(read_local_pack(b"   

", "empty.txt").is_err());
    }

    #[test]
    fn normalises_ebible_book_codes_to_usfm() {
        // eBible ships JOH/PHI/MAR/JAM where USFM says JHN/PHP/MRK/JAS. Storing
        // the source codes would hide John and Philippians from the navigator.
        let body = "JOH 3:16 Karena Allah mengasihi dunia.\n\
                    PHI 4:13 Segala perkara dapat kutanggung.\n\
                    MAR 1:1 Permulaan Injil.\n\
                    JAM 1:2 Anggaplah sebagai kebahagiaan.\n\
                    1JO 4:8 Allah adalah kasih.\n\
                    GEN 1:1 Pada mulanya.\n";
        let ids: Vec<_> = parse_vpl(body).into_iter().map(|v| v.book_id).collect();
        assert_eq!(ids, vec!["JHN", "PHP", "MRK", "JAS", "1JN", "GEN"]);
    }
}
