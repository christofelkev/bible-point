use std::collections::HashSet;

use crate::model::Translation;

/// Machine-readable index of everything eBible.org publishes, including a
/// per-translation redistribution flag and the publisher's copyright line.
const CATALOG_URL: &str = "https://ebible.org/Scriptures/translations.csv";

/// Where a translation's verse-per-line archive lives.
pub fn pack_url(translation_id: &str) -> String {
    format!("https://ebible.org/Scriptures/{translation_id}_vpl.zip")
}

/// HTTP client used for every catalog and pack request.
///
/// eBible answers 403 to clients that look like anonymous scrapers, so the app
/// identifies itself. Building the client here keeps that identification in one
/// place rather than depending on whatever default each call site inherits.
pub fn http_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .user_agent(concat!("BiblePoint/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|e| format!("gagal menyiapkan koneksi: {e}"))
}

/// Fetches the catalog and keeps only what this app is allowed to redistribute.
///
/// The licence decision is made from the publisher's own `Redistributable`
/// flag, never from a hand-maintained list — a hard-coded allowlist would drift
/// out of date the moment a publisher changed terms, and silently keep shipping
/// text the app no longer has permission to distribute.
///
/// `installed_ids` marks entries the user already has, so one list can drive
/// both tabs of the Bible Manager.
pub async fn fetch(installed_ids: &HashSet<String>) -> Result<Vec<Translation>, String> {
    let body = http_client()?
        .get(CATALOG_URL)
        .send()
        .await
        .map_err(|e| format!("gagal menghubungi katalog: {e}"))?
        .error_for_status()
        .map_err(|e| format!("katalog menolak permintaan: {e}"))?
        .bytes()
        .await
        .map_err(|e| format!("gagal membaca katalog: {e}"))?;

    parse(&body, installed_ids)
}

/// Split out from `fetch` so the parsing rules are testable without a network.
pub fn parse(body: &[u8], installed_ids: &HashSet<String>) -> Result<Vec<Translation>, String> {
    // The file is served with a UTF-8 BOM, which would otherwise become part of
    // the first column's name and break every header lookup.
    let body = body.strip_prefix(&[0xEF, 0xBB, 0xBF][..]).unwrap_or(body);

    let mut reader = csv::ReaderBuilder::new().flexible(true).from_reader(body);
    let headers = reader
        .headers()
        .map_err(|e| format!("header katalog tidak terbaca: {e}"))?
        .clone();

    let col = |name: &str| headers.iter().position(|h| h == name);
    let (
        Some(c_id), Some(c_lang), Some(c_lang_name), Some(c_title),
        Some(c_redis), Some(c_copyright), Some(c_dl),
    ) = (
        col("translationId"), col("languageCode"), col("languageNameInEnglish"),
        col("title"), col("Redistributable"), col("Copyright"), col("downloadable"),
    ) else {
        return Err("format katalog berubah: kolom wajib tidak ditemukan".into());
    };
    let c_ot_verses = col("OTverses");
    let c_nt_verses = col("NTverses");
    let c_url = col("publicationURL");

    let truthy = |s: &str| matches!(s.trim().to_ascii_lowercase().as_str(), "true" | "1" | "yes");
    let number = |rec: &csv::StringRecord, idx: Option<usize>| -> i64 {
        idx.and_then(|i| rec.get(i)).and_then(|v| v.trim().parse().ok()).unwrap_or(0)
    };

    let mut out = Vec::new();
    for record in reader.records() {
        let Ok(rec) = record else { continue };

        let Some(id) = rec.get(c_id).map(str::trim).filter(|s| !s.is_empty()) else { continue };
        if !truthy(rec.get(c_redis).unwrap_or("")) || !truthy(rec.get(c_dl).unwrap_or("")) {
            continue;
        }

        let ot = number(&rec, c_ot_verses);
        let nt = number(&rec, c_nt_verses);
        if ot + nt == 0 {
            continue; // Nothing to read; keep it out of the operator's way.
        }

        let language = rec.get(c_lang).unwrap_or("").trim().to_string();
        let license = rec.get(c_copyright).unwrap_or("").trim().to_string();

        out.push(Translation {
            abbrev: derive_abbrev(id, &language),
            year: extract_year(&license),
            installed: installed_ids.contains(id),
            id: id.to_string(),
            name: rec.get(c_title).unwrap_or(id).trim().to_string(),
            language_name: rec.get(c_lang_name).unwrap_or("").trim().to_string(),
            license: if license.is_empty() { "Lisensi tidak dicantumkan".into() } else { license },
            language,
            verse_count: ot + nt,
            has_old_testament: ot > 0,
            has_new_testament: nt > 0,
            size_bytes: None,
            source_url: c_url.and_then(|i| rec.get(i)).map(|s| s.trim().to_string()),
        });
    }

    out.sort_by(|a, b| a.language_name.cmp(&b.language_name).then(a.name.cmp(&b.name)));
    Ok(out)
}

/// Turns a translation id into a short label for dense UI.
///
/// eBible ids embed the language code as a prefix ("indayt", "eng-kjv2006"),
/// so stripping it leaves the part that actually names the translation.
fn derive_abbrev(id: &str, language_code: &str) -> String {
    let rest = id.strip_prefix(language_code).unwrap_or(id).trim_start_matches('-');
    if rest.is_empty() { id.to_uppercase() } else { rest.to_uppercase() }
}

/// Pulls the most recent four-digit year out of a copyright line.
///
/// Copyright notices commonly carry a range ("2011-2024"); the later year is
/// the meaningful one to display.
fn extract_year(text: &str) -> Option<i64> {
    let bytes = text.as_bytes();
    let mut best = None;
    for i in 0..bytes.len().saturating_sub(3) {
        let window = &bytes[i..i + 4];
        if window.iter().all(u8::is_ascii_digit) && matches!(window[0], b'1' | b'2') {
            // Reject digits that are part of a longer run, e.g. an ISBN.
            let before_ok = i == 0 || !bytes[i - 1].is_ascii_digit();
            let after_ok = i + 4 >= bytes.len() || !bytes[i + 4].is_ascii_digit();
            if before_ok && after_ok {
                if let Ok(year) = std::str::from_utf8(window).unwrap_or("").parse::<i64>() {
                    if (1000..=2999).contains(&year) {
                        best = Some(best.map_or(year, |b: i64| b.max(year)));
                    }
                }
            }
        }
    }
    best
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn abbrev_strips_the_language_prefix() {
        assert_eq!(derive_abbrev("indayt", "ind"), "AYT");
        assert_eq!(derive_abbrev("eng-kjv2006", "eng"), "KJV2006");
        assert_eq!(derive_abbrev("engwebp", "eng"), "WEBP");
    }

    #[test]
    fn abbrev_falls_back_when_id_is_only_the_language() {
        assert_eq!(derive_abbrev("ind", "ind"), "IND");
    }

    #[test]
    fn year_takes_the_later_end_of_a_range() {
        assert_eq!(extract_year("Copyright © 2011-2024 YLSA-AYT"), Some(2024));
        assert_eq!(extract_year("public domain"), None);
    }

    #[test]
    fn parse_keeps_only_redistributable_downloadable_entries() {
        let csv = "\u{feff}\"translationId\",\"languageCode\",\"languageNameInEnglish\",\"title\",\"Redistributable\",\"Copyright\",\"downloadable\",\"OTverses\",\"NTverses\"\n\
                   \"indayt\",\"ind\",\"Indonesian\",\"Alkitab Yang Terbuka\",\"True\",\"Copyright 2011-2024 YLSA-AYT\",\"True\",\"23145\",\"7957\"\n\
                   \"locked\",\"eng\",\"English\",\"Restricted Bible\",\"False\",\"All rights reserved\",\"True\",\"23145\",\"7957\"\n\
                   \"empty\",\"eng\",\"English\",\"Nothing Here\",\"True\",\"public domain\",\"True\",\"0\",\"0\"\n";
        let out = parse(csv.as_bytes(), &HashSet::new()).unwrap();
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].id, "indayt");
        assert_eq!(out[0].abbrev, "AYT");
        assert!(out[0].has_old_testament && out[0].has_new_testament);
    }
}
