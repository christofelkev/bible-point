use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};

/// Background images live beside the settings file so a saved theme can point
/// at something that still exists after a restart.
const DIR_NAME: &str = "backgrounds";

pub fn dir(app_data_dir: PathBuf) -> PathBuf {
    app_data_dir.join(DIR_NAME)
}

/// Copies an uploaded image into the app's own storage and returns its path.
///
/// Themes previously stored a browser object URL, which is valid only for the
/// life of the page. Once themes started surviving restarts, that meant a saved
/// design reopened with a dead background — visible on the projector, in front
/// of everyone. Owning a copy of the file is what makes the theme's reference
/// outlast the session.
///
/// The file is named after a hash of its contents, so importing the same image
/// twice reuses one copy instead of accumulating duplicates.
pub fn import_background(dir: &Path, file_name: &str, bytes: &[u8]) -> Result<PathBuf, String> {
    std::fs::create_dir_all(dir).map_err(|e| format!("gagal menyiapkan folder gambar: {e}"))?;

    let extension = Path::new(file_name)
        .extension()
        .and_then(|e| e.to_str())
        .filter(|e| e.len() <= 5 && e.chars().all(|c| c.is_ascii_alphanumeric()))
        .unwrap_or("img")
        .to_ascii_lowercase();

    let mut hasher = DefaultHasher::new();
    bytes.hash(&mut hasher);
    let target = dir.join(format!("{:016x}.{extension}", hasher.finish()));

    // Same contents, same name: the copy already on disk is the same file.
    if !target.exists() {
        std::fs::write(&target, bytes).map_err(|e| format!("gagal menyimpan gambar: {e}"))?;
    }

    Ok(target)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identical_images_reuse_one_file() {
        let dir = std::env::temp_dir().join("bible-point-media-dedup");
        let _ = std::fs::remove_dir_all(&dir);

        let a = import_background(&dir, "sunset.JPG", b"pretend-jpeg").unwrap();
        let b = import_background(&dir, "another-name.jpg", b"pretend-jpeg").unwrap();
        assert_eq!(a, b, "same bytes should land on the same file");
        assert_eq!(std::fs::read_dir(&dir).unwrap().count(), 1);
        assert_eq!(a.extension().unwrap(), "jpg", "extension should be lowercased");

        let c = import_background(&dir, "other.png", b"different-bytes").unwrap();
        assert_ne!(a, c);
        assert_eq!(std::fs::read_dir(&dir).unwrap().count(), 2);

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_a_hostile_extension() {
        let dir = std::env::temp_dir().join("bible-point-media-ext");
        let _ = std::fs::remove_dir_all(&dir);

        // A crafted name must not escape the directory or pick up an extension
        // with path separators in it.
        let path = import_background(&dir, "../../evil.pn g", b"x").unwrap();
        assert_eq!(path.parent().unwrap(), dir);
        assert_eq!(path.extension().unwrap(), "img");

        let _ = std::fs::remove_dir_all(&dir);
    }
}
