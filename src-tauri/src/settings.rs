use std::path::PathBuf;

/// Persisted application state, stored as opaque JSON.
///
/// Rust deliberately does not model the shape. The frontend owns that schema
/// and evolves it; duplicating it here would create two definitions that drift
/// apart, and the backend has no reason to inspect a theme or a playlist.
const FILE_NAME: &str = "settings.json";

pub fn path(app_data_dir: PathBuf) -> PathBuf {
    app_data_dir.join(FILE_NAME)
}

/// Reads the settings file, or `None` when it has never been written.
///
/// A file that exists but cannot be read is reported as an error rather than
/// silently treated as absent — losing a service order is worth a message.
pub fn load(path: &std::path::Path) -> Result<Option<String>, String> {
    match std::fs::read_to_string(path) {
        Ok(contents) => Ok(Some(contents)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(format!("gagal membaca pengaturan: {e}")),
    }
}

/// Writes settings atomically.
///
/// The app saves on every theme adjustment, so a write is in flight often. A
/// plain truncate-and-write would leave a half-written file if the machine lost
/// power mid-save — and the operator would find their presets gone. Writing to
/// a sibling temp file and renaming means the settings file is only ever the
/// old version or the new one.
pub fn save(path: &std::path::Path, contents: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("gagal menyiapkan folder pengaturan: {e}"))?;
    }

    let temp = path.with_extension("json.tmp");
    std::fs::write(&temp, contents).map_err(|e| format!("gagal menulis pengaturan: {e}"))?;
    std::fs::rename(&temp, path).map_err(|e| format!("gagal menyimpan pengaturan: {e}"))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn load_returns_none_before_anything_is_saved() {
        let dir = std::env::temp_dir().join("bible-point-settings-none");
        let _ = std::fs::remove_dir_all(&dir);
        assert_eq!(load(&dir.join(FILE_NAME)).unwrap(), None);
    }

    #[test]
    fn save_then_load_round_trips_and_leaves_no_temp_file() {
        let dir = std::env::temp_dir().join("bible-point-settings-roundtrip");
        let _ = std::fs::remove_dir_all(&dir);
        let file = path(dir.clone());

        save(&file, r#"{"version":1}"#).unwrap();
        assert_eq!(load(&file).unwrap().as_deref(), Some(r#"{"version":1}"#));

        save(&file, r#"{"version":2}"#).unwrap();
        assert_eq!(load(&file).unwrap().as_deref(), Some(r#"{"version":2}"#));

        // The rename must consume the temp file, not accumulate copies.
        assert!(!file.with_extension("json.tmp").exists());

        let _ = std::fs::remove_dir_all(&dir);
    }
}
