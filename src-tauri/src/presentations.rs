use std::path::{Path, PathBuf};

const FILE_NAME: &str = "presentations.json";

pub fn json_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join(FILE_NAME)
}

pub fn decks_dir(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join("presentations")
}

pub fn deck_dir(app_data_dir: &Path, deck_id: &str) -> PathBuf {
    // Sanitise deck_id to prevent directory traversal
    let safe_id: String = deck_id
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_')
        .collect();
    decks_dir(app_data_dir).join(safe_id)
}

/// Reads the presentations manifest file, or `None` if it does not exist yet.
pub fn load(path: &Path) -> Result<Option<String>, String> {
    match std::fs::read_to_string(path) {
        Ok(contents) => Ok(Some(contents)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(format!("gagal membaca berkas presentasi: {e}")),
    }
}

/// Writes presentations atomically using a sibling temporary file and rename.
pub fn save(path: &Path, contents: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("gagal menyiapkan folder presentasi: {e}"))?;
    }

    let temp = path.with_extension("json.tmp");
    std::fs::write(&temp, contents).map_err(|e| format!("gagal menulis berkas presentasi: {e}"))?;
    std::fs::rename(&temp, path).map_err(|e| format!("gagal menyimpan berkas presentasi: {e}"))?;

    Ok(())
}

/// Saves a single rendered slide image (PNG) into the deck directory.
pub fn save_slide(
    app_data_dir: &Path,
    deck_id: &str,
    slide_index: usize,
    bytes: &[u8],
) -> Result<PathBuf, String> {
    let dir = deck_dir(app_data_dir, deck_id);
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("gagal membuat folder slide presentasi: {e}"))?;

    let file_path = dir.join(format!("slide_{:04}.png", slide_index));
    std::fs::write(&file_path, bytes)
        .map_err(|e| format!("gagal menyimpan gambar slide presentasi: {e}"))?;

    Ok(file_path)
}

/// Deletes a presentation deck and all its associated slide images.
pub fn delete_deck(app_data_dir: &Path, deck_id: &str) -> Result<(), String> {
    let dir = deck_dir(app_data_dir, deck_id);
    if dir.exists() {
        std::fs::remove_dir_all(&dir)
            .map_err(|e| format!("gagal menghapus slide presentasi: {e}"))?;
    }
    Ok(())
}

/// Converts a PPTX presentation file to slide images on Windows using PowerPoint COM automation.
#[cfg(target_os = "windows")]
pub fn convert_pptx(
    app_data_dir: &Path,
    pptx_path: &str,
    deck_id: &str,
) -> Result<Vec<String>, String> {
    use std::process::Command;

    let input_path = Path::new(pptx_path);
    if !input_path.exists() {
        return Err(format!("berkas PPTX tidak ditemukan: {pptx_path}"));
    }

    let out_dir = deck_dir(app_data_dir, deck_id);
    std::fs::create_dir_all(&out_dir)
        .map_err(|e| format!("gagal menyiapkan folder ekspor slide: {e}"))?;

    let escaped_input = pptx_path.replace('\'', "''");
    let escaped_out = out_dir
        .to_string_lossy()
        .to_string()
        .replace('\'', "''");

    let script = format!(
        "$ErrorActionPreference = 'Stop'\n\
        try {{\n\
            $ppt = New-Object -ComObject PowerPoint.Application\n\
        }} catch {{\n\
            Write-Error 'NO_POWERPOINT'\n\
            exit 2\n\
        }}\n\
        try {{\n\
            $pres = $ppt.Presentations.Open('{escaped_input}', [Microsoft.Office.Core.MsoTriState]::msoTrue, [Microsoft.Office.Core.MsoTriState]::msoFalse, [Microsoft.Office.Core.MsoTriState]::msoFalse)\n\
            $pres.Export('{escaped_out}', 'PNG', 1920, 1080)\n\
            $pres.Close()\n\
        }} catch {{\n\
            Write-Error $_.Exception.Message\n\
            exit 3\n\
        }} finally {{\n\
            try {{\n\
                $ppt.Quit()\n\
                [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null\n\
            }} catch {{}}\n\
        }}"
    );

    let output = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", &script])
        .output()
        .map_err(|e| format!("gagal menjalankan konversi PowerPoint: {e}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        if stderr.contains("NO_POWERPOINT") || output.status.code() == Some(2) {
            return Err("Microsoft PowerPoint tidak terpasang di komputer ini. Silakan buka berkas di PowerPoint / Canva / Google Slides dan ekspor sebagai PDF, lalu gunakan fitur Import PDF.".into());
        }
        return Err(format!("ekspor PowerPoint gagal: {stderr}"));
    }

    // Collect exported PNG slides
    let mut slides: Vec<(u32, PathBuf)> = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&out_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                if ext.eq_ignore_ascii_case("png") {
                    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
                    // PowerPoint exports as Slide1.PNG, Slide2.PNG...
                    let num = stem
                        .trim_start_matches(|c: char| !c.is_ascii_digit())
                        .parse::<u32>()
                        .unwrap_or(0);
                    slides.push((num, path));
                }
            }
        }
    }

    if slides.is_empty() {
        return Err("tidak ada slide yang berhasil diekspor dari berkas PPTX ini.".into());
    }

    slides.sort_by_key(|(num, _)| *num);
    Ok(slides
        .into_iter()
        .map(|(_, p)| p.to_string_lossy().to_string())
        .collect())
}

#[cfg(not(target_os = "windows"))]
pub fn convert_pptx(
    _app_data_dir: &Path,
    _pptx_path: &str,
    _deck_id: &str,
) -> Result<Vec<String>, String> {
    Err("Konversi PPTX otomatis saat ini hanya didukung di Windows dengan Microsoft Office. Silakan ekspor ke format PDF terlebih dahulu.".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn load_returns_none_when_file_not_found() {
        let dir = std::env::temp_dir().join("bp-pres-test-none");
        let _ = std::fs::remove_dir_all(&dir);
        assert_eq!(load(&dir.join(FILE_NAME)).unwrap(), None);
    }

    #[test]
    fn save_and_load_roundtrip() {
        let dir = std::env::temp_dir().join("bp-pres-test-roundtrip");
        let _ = std::fs::remove_dir_all(&dir);
        let path = json_path(&dir);

        save(&path, r#"[{"id":"d1","title":"Test Deck"}]"#).unwrap();
        assert_eq!(
            load(&path).unwrap().as_deref(),
            Some(r#"[{"id":"d1","title":"Test Deck"}]"#)
        );

        assert!(!path.with_extension("json.tmp").exists());
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn save_slide_and_delete_deck() {
        let dir = std::env::temp_dir().join("bp-pres-test-slide");
        let _ = std::fs::remove_dir_all(&dir);

        let slide_path = save_slide(&dir, "deck-123", 0, b"fake-png-bytes").unwrap();
        assert!(slide_path.exists());

        delete_deck(&dir, "deck-123").unwrap();
        assert!(!deck_dir(&dir, "deck-123").exists());

        let _ = std::fs::remove_dir_all(&dir);
    }
}
