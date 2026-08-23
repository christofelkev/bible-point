use rusqlite::{params, Connection};
use std::path::Path;

use crate::model::{BookSummary, Translation, Verse};

/// Opens (creating if needed) the local Bible database and applies the schema.
pub fn open(path: &Path) -> rusqlite::Result<Connection> {
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let conn = Connection::open(path)?;

    // WAL keeps reads responsive while a pack import writes tens of thousands
    // of rows, so browsing one translation never blocks on installing another.
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "synchronous", "NORMAL")?;
    conn.pragma_update(None, "foreign_keys", "ON")?;

    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS translations (
            id            TEXT PRIMARY KEY,
            name          TEXT NOT NULL,
            abbrev        TEXT NOT NULL,
            language      TEXT NOT NULL,
            language_name TEXT NOT NULL,
            license       TEXT NOT NULL,
            year          INTEGER,
            verse_count   INTEGER NOT NULL DEFAULT 0,
            size_bytes    INTEGER NOT NULL DEFAULT 0,
            source_url    TEXT,
            installed_at  INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS verses (
            id             INTEGER PRIMARY KEY,
            translation_id TEXT NOT NULL REFERENCES translations(id) ON DELETE CASCADE,
            book_id        TEXT NOT NULL,
            chapter        INTEGER NOT NULL,
            verse          INTEGER NOT NULL,
            text           TEXT NOT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_verses_ref
            ON verses(translation_id, book_id, chapter, verse);
        CREATE INDEX IF NOT EXISTS idx_verses_chapter
            ON verses(translation_id, book_id, chapter);

        -- External-content FTS: the index stores no copy of the text, it points
        -- back at `verses` by rowid. Halves the disk cost of every pack.
        CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5(
            text,
            content='verses',
            content_rowid='id',
            tokenize="unicode61 remove_diacritics 2"
        );
        "#,
    )?;

    Ok(conn)
}

/// Every installed translation, ordered by language then name.
pub fn list_installed(conn: &Connection) -> rusqlite::Result<Vec<Translation>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, abbrev, language, language_name, license, year,
                verse_count, size_bytes, source_url,
                EXISTS(SELECT 1 FROM verses v WHERE v.translation_id = translations.id
                       AND v.book_id IN ('GEN','EXO','PSA','ISA','MAL')) AS has_ot,
                EXISTS(SELECT 1 FROM verses v WHERE v.translation_id = translations.id
                       AND v.book_id IN ('MAT','JHN','ROM','REV')) AS has_nt
         FROM translations
         ORDER BY language_name, name",
    )?;

    let rows = stmt.query_map([], |r| {
        Ok(Translation {
            id: r.get(0)?,
            name: r.get(1)?,
            abbrev: r.get(2)?,
            language: r.get(3)?,
            language_name: r.get(4)?,
            license: r.get(5)?,
            year: r.get(6)?,
            verse_count: r.get(7)?,
            size_bytes: Some(r.get(8)?),
            source_url: r.get(9)?,
            has_old_testament: r.get::<_, i64>(10)? != 0,
            has_new_testament: r.get::<_, i64>(11)? != 0,
            installed: true,
        })
    })?;

    rows.collect()
}

/// Books present in a translation, with each book's highest chapter number.
///
/// Derived from the verses actually imported rather than a fixed canon list, so
/// New Testament-only packs report exactly what they contain.
pub fn books(conn: &Connection, translation_id: &str) -> rusqlite::Result<Vec<BookSummary>> {
    let mut stmt = conn.prepare(
        "SELECT book_id, MAX(chapter) FROM verses
         WHERE translation_id = ?1
         GROUP BY book_id",
    )?;
    let rows = stmt.query_map(params![translation_id], |r| {
        Ok(BookSummary { book_id: r.get(0)?, chapter_count: r.get(1)? })
    })?;
    rows.collect()
}

pub fn chapter(
    conn: &Connection,
    translation_id: &str,
    book_id: &str,
    chapter: i64,
) -> rusqlite::Result<Vec<Verse>> {
    let mut stmt = conn.prepare(
        "SELECT verse, text FROM verses
         WHERE translation_id = ?1 AND book_id = ?2 AND chapter = ?3
         ORDER BY verse",
    )?;
    let rows = stmt.query_map(params![translation_id, book_id, chapter], |r| {
        Ok(Verse {
            translation_id: translation_id.to_string(),
            book_id: book_id.to_string(),
            chapter,
            verse: r.get(0)?,
            text: r.get(1)?,
        })
    })?;
    rows.collect()
}

/// Full-text search within one translation, ranked by FTS5 relevance.
pub fn search(
    conn: &Connection,
    translation_id: &str,
    query: &str,
    limit: i64,
) -> rusqlite::Result<Vec<Verse>> {
    let mut stmt = conn.prepare(
        "SELECT v.book_id, v.chapter, v.verse, v.text
         FROM verses_fts f
         JOIN verses v ON v.id = f.rowid
         WHERE verses_fts MATCH ?1 AND v.translation_id = ?2
         ORDER BY rank
         LIMIT ?3",
    )?;
    let rows = stmt.query_map(params![query, translation_id, limit], |r| {
        Ok(Verse {
            translation_id: translation_id.to_string(),
            book_id: r.get(0)?,
            chapter: r.get(1)?,
            verse: r.get(2)?,
            text: r.get(3)?,
        })
    })?;
    rows.collect()
}

/// Removes a translation and everything indexed from it.
///
/// The FTS rows must go first: they are deleted by rowid drawn from `verses`,
/// so clearing `verses` beforehand would leave the index pointing at nothing.
pub fn uninstall(conn: &mut Connection, translation_id: &str) -> rusqlite::Result<()> {
    let tx = conn.transaction()?;
    tx.execute(
        "DELETE FROM verses_fts WHERE rowid IN
            (SELECT id FROM verses WHERE translation_id = ?1)",
        params![translation_id],
    )?;
    tx.execute("DELETE FROM verses WHERE translation_id = ?1", params![translation_id])?;
    tx.execute("DELETE FROM translations WHERE id = ?1", params![translation_id])?;
    tx.commit()
}

/// Escapes a user's words into an FTS5 MATCH expression.
///
/// Every token is wrapped in double quotes so punctuation the operator types —
/// apostrophes, colons, hyphens — is treated as text rather than FTS syntax.
/// Without this, searching for a phrase containing `-` silently becomes a NOT.
pub fn to_match_expression(query: &str) -> String {
    query
        .split_whitespace()
        .map(|t| format!("\"{}\"", t.replace('"', "\"\"")))
        .collect::<Vec<_>>()
        .join(" ")
}
