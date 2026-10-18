use std::path::PathBuf;

/// Persisted worship songs collection, stored as JSON in the app data directory.
///
/// Like settings.json, the shape is owned by the frontend. Rust reads and writes
/// it atomically so that mid-write crashes never leave a corrupted file.
const FILE_NAME: &str = "songs.json";

pub fn path(app_data_dir: PathBuf) -> PathBuf {
    app_data_dir.join(FILE_NAME)
}

/// Reads the songs file, or `None` when it has never been written yet.
pub fn load(path: &std::path::Path) -> Result<Option<String>, String> {
    match std::fs::read_to_string(path) {
        Ok(contents) => Ok(Some(contents)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(format!("gagal membaca berkas lagu: {e}")),
    }
}

/// Writes songs atomically using a sibling temporary file and rename.
pub fn save(path: &std::path::Path, contents: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("gagal menyiapkan folder lagu: {e}"))?;
    }

    let temp = path.with_extension("json.tmp");
    std::fs::write(&temp, contents).map_err(|e| format!("gagal menulis berkas lagu: {e}"))?;
    std::fs::rename(&temp, path).map_err(|e| format!("gagal menyimpan berkas lagu: {e}"))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn load_returns_none_before_anything_is_saved() {
        let dir = std::env::temp_dir().join("bible-point-songs-none");
        let _ = std::fs::remove_dir_all(&dir);
        assert_eq!(load(&dir.join(FILE_NAME)).unwrap(), None);
    }

    #[test]
    fn save_then_load_round_trips_and_leaves_no_temp_file() {
        let dir = std::env::temp_dir().join("bible-point-songs-roundtrip");
        let _ = std::fs::remove_dir_all(&dir);
        let file = path(dir.clone());

        save(&file, r#"[{"id":"s1","title":"Test"}]"#).unwrap();
        assert_eq!(
            load(&file).unwrap().as_deref(),
            Some(r#"[{"id":"s1","title":"Test"}]"#)
        );

        // The rename must consume the temp file.
        assert!(!file.with_extension("json.tmp").exists());

        let _ = std::fs::remove_dir_all(&dir);
    }
}
