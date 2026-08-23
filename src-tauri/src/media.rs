use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};

/// Kinds of operator-supplied file the app stores a copy of.
///
/// Each lives in its own subdirectory so pruning one never touches the other.
#[derive(Clone, Copy)]
pub enum AssetKind {
    Background,
    Font,
}

impl AssetKind {
    fn dir_name(self) -> &'static str {
        match self {
            AssetKind::Background => "backgrounds",
            AssetKind::Font => "fonts",
        }
    }

    /// Extensions accepted for this kind, lowercase and without a dot.
    fn allowed(self) -> &'static [&'static str] {
        match self {
            AssetKind::Background => &["jpg", "jpeg", "png", "webp", "gif", "avif", "mp4", "webm"],
            AssetKind::Font => &["ttf", "otf", "woff", "woff2"],
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "background" => Some(AssetKind::Background),
            "font" => Some(AssetKind::Font),
            _ => None,
        }
    }
}

pub fn dir(app_data_dir: &Path, kind: AssetKind) -> PathBuf {
    app_data_dir.join(kind.dir_name())
}

/// Copies an operator-supplied file into the app's own storage.
///
/// Themes outlive the session that created them, so a theme cannot reference a
/// file wherever the operator happened to have it — that file may be on a USB
/// stick that is gone by Sunday. Owning a copy is what makes the reference hold.
///
/// The stored name is a hash of the contents, so importing the same file twice
/// reuses one copy. The extension is taken from the original name but only when
/// it is one this app expects; anything else is rejected rather than written,
/// since the stored path is later handed to a webview to load.
pub fn import_asset(
    dir: &Path,
    kind: AssetKind,
    file_name: &str,
    bytes: &[u8],
) -> Result<PathBuf, String> {
    let extension = Path::new(file_name)
        .extension()
        .and_then(|e| e.to_str())
        .map(str::to_ascii_lowercase)
        .filter(|e| kind.allowed().contains(&e.as_str()))
        .ok_or_else(|| {
            format!(
                "format berkas tidak didukung. Gunakan: {}",
                kind.allowed().join(", ")
            )
        })?;

    std::fs::create_dir_all(dir).map_err(|e| format!("gagal menyiapkan folder: {e}"))?;

    let mut hasher = DefaultHasher::new();
    bytes.hash(&mut hasher);
    let target = dir.join(format!("{:016x}.{extension}", hasher.finish()));

    // Same contents, same name: the copy already on disk is the same file.
    if !target.exists() {
        std::fs::write(&target, bytes).map_err(|e| format!("gagal menyimpan berkas: {e}"))?;
    }

    Ok(target)
}

/// Deletes stored files that nothing references any more.
///
/// Without this, every background the operator ever tried stays on disk
/// forever — a church machine would accumulate them silently. `keep` is the set
/// of paths still named by a theme; anything else in the directory goes.
///
/// Returns how many files were removed.
pub fn prune(dir: &Path, keep: &[String]) -> Result<usize, String> {
    if !dir.exists() {
        return Ok(0);
    }

    let keep: Vec<PathBuf> = keep.iter().map(PathBuf::from).collect();
    let entries = std::fs::read_dir(dir).map_err(|e| format!("gagal membaca folder: {e}"))?;
    let mut removed = 0;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        // Compare by file name rather than full path: a settings file copied
        // from another machine carries that machine's directory layout.
        let referenced = keep.iter().any(|k| k.file_name() == path.file_name());
        if !referenced && std::fs::remove_file(&path).is_ok() {
            removed += 1;
        }
    }

    Ok(removed)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scratch(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(name);
        let _ = std::fs::remove_dir_all(&dir);
        dir
    }

    #[test]
    fn identical_files_reuse_one_copy() {
        let dir = scratch("bp-media-dedup");

        let a = import_asset(&dir, AssetKind::Background, "sunset.JPG", b"pretend-jpeg").unwrap();
        let b = import_asset(&dir, AssetKind::Background, "other-name.jpg", b"pretend-jpeg").unwrap();
        assert_eq!(a, b, "same bytes should land on the same file");
        assert_eq!(a.extension().unwrap(), "jpg", "extension should be lowercased");
        assert_eq!(std::fs::read_dir(&dir).unwrap().count(), 1);

        let c = import_asset(&dir, AssetKind::Background, "other.png", b"different").unwrap();
        assert_ne!(a, c);
        assert_eq!(std::fs::read_dir(&dir).unwrap().count(), 2);

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn rejects_extensions_the_kind_does_not_accept() {
        let dir = scratch("bp-media-ext");

        // A font file offered as a background, and a path traversal attempt,
        // must both be refused before anything is written.
        assert!(import_asset(&dir, AssetKind::Background, "evil.exe", b"x").is_err());
        assert!(import_asset(&dir, AssetKind::Font, "photo.png", b"x").is_err());
        assert!(import_asset(&dir, AssetKind::Background, "../../escape", b"x").is_err());
        assert!(!dir.exists(), "nothing should be written for a rejected file");

        // The kinds do accept what they are for.
        assert!(import_asset(&dir, AssetKind::Font, "brand.woff2", b"x").is_ok());
        assert!(import_asset(&dir, AssetKind::Background, "loop.mp4", b"x").is_ok());

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn prune_removes_only_unreferenced_files() {
        let dir = scratch("bp-media-prune");

        let keep = import_asset(&dir, AssetKind::Background, "keep.png", b"still-used").unwrap();
        let drop = import_asset(&dir, AssetKind::Background, "drop.png", b"orphaned").unwrap();

        let removed = prune(&dir, &[keep.to_string_lossy().into_owned()]).unwrap();
        assert_eq!(removed, 1);
        assert!(keep.exists(), "referenced file must survive");
        assert!(!drop.exists(), "orphan must be removed");

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn prune_matches_by_file_name_so_settings_can_move_between_machines() {
        let dir = scratch("bp-media-prune-portable");
        let file = import_asset(&dir, AssetKind::Background, "shared.png", b"content").unwrap();

        // Same file name, a directory layout from some other computer.
        let foreign = format!("/home/someone-else/app/backgrounds/{}", file.file_name().unwrap().to_string_lossy());
        assert_eq!(prune(&dir, &[foreign]).unwrap(), 0);
        assert!(file.exists());

        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn prune_on_a_missing_directory_is_not_an_error() {
        assert_eq!(prune(&scratch("bp-media-absent"), &[]).unwrap(), 0);
    }
}
