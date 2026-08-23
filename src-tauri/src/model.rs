use serde::{Deserialize, Serialize};

/// A Bible translation, whether installed locally or merely offered by the catalog.
///
/// Field names are camelCase on the wire so the TypeScript `Translation` type
/// consumes them without a mapping layer.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Translation {
    pub id: String,
    pub name: String,
    pub abbrev: String,
    pub language: String,
    pub language_name: String,
    /// Copyright line exactly as the source publishes it. Never synthesised —
    /// it is the record of why redistributing this text is permitted.
    pub license: String,
    pub year: Option<i64>,
    pub installed: bool,
    pub verse_count: i64,
    pub has_old_testament: bool,
    pub has_new_testament: bool,
    /// Bytes on disk once installed; absent for catalog-only entries.
    pub size_bytes: Option<i64>,
    pub source_url: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BookSummary {
    pub book_id: String,
    pub chapter_count: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Verse {
    pub translation_id: String,
    pub book_id: String,
    pub chapter: i64,
    pub verse: i64,
    pub text: String,
}

/// Progress of a pack installation, emitted as it runs.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallProgress {
    pub translation_id: String,
    /// One of: downloading, extracting, importing, indexing, done, error.
    pub phase: String,
    /// 0..100. Downloading reports real bytes; later phases report step estimates.
    pub percent: u8,
    pub message: Option<String>,
}
