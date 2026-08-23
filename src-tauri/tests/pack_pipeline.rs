//! End-to-end check of the Bible pack pipeline against the real source.
//!
//! Downloads a translation from eBible.org, runs it through extract, parse and
//! import, then queries the result the way the app does. This is what proves
//! the pieces fit — unit tests cover each stage in isolation, but only this
//! catches a mismatch between them, such as book codes that parse fine and then
//! cannot be found again.
//!
//! Ignored by default because it needs the network and pulls several MB. Run it
//! deliberately:
//!
//!     cargo test --test pack_pipeline -- --ignored --nocapture

use app_lib::{catalog, db, install, model::Translation};

const TRANSLATION_ID: &str = "eng-kjv2006";

fn meta() -> Translation {
    Translation {
        id: TRANSLATION_ID.into(),
        name: "King James Version".into(),
        abbrev: "KJV2006".into(),
        language: "eng".into(),
        language_name: "English".into(),
        license: "public domain".into(),
        year: Some(2006),
        installed: true,
        verse_count: 0,
        has_old_testament: true,
        has_new_testament: true,
        size_bytes: None,
        source_url: None,
    }
}

#[test]
#[ignore = "downloads several MB from ebible.org"]
fn downloads_imports_and_queries_a_real_translation() {
    let dir = std::env::temp_dir().join("bible-point-test");
    let _ = std::fs::remove_dir_all(&dir);
    let mut conn = db::open(&dir.join("test.db")).expect("open database");

    // --- download ---------------------------------------------------------
    let runtime = tokio::runtime::Runtime::new().expect("tokio runtime");
    let archive = runtime.block_on(async {
        catalog::http_client()
            .expect("http client")
            .get(catalog::pack_url(TRANSLATION_ID))
            .send()
            .await
            .expect("request")
            .error_for_status()
            .expect("status")
            .bytes()
            .await
            .expect("body")
    });
    assert!(archive.len() > 1_000_000, "archive suspiciously small");

    // --- extract and parse -------------------------------------------------
    let body = install::extract_vpl(&archive, TRANSLATION_ID).expect("extract vpl");
    let verses = install::parse_vpl(&body);
    assert!(
        verses.len() > 30_000,
        "expected a whole Bible, parsed {} verses",
        verses.len()
    );

    // --- import ------------------------------------------------------------
    install::import(&|_, _| {}, &mut conn, &meta(), &verses, archive.len() as i64)
        .expect("import");

    // --- the pipeline's real contract --------------------------------------
    // John and Philippians are the books eBible names JOH and PHI. If
    // normalisation regressed they would parse and import happily, then be
    // unreachable here — which is exactly the failure this test exists for.
    let john3 = db::chapter(&conn, TRANSLATION_ID, "JHN", 3).expect("query John 3");
    assert_eq!(john3.len(), 36, "John 3 should have 36 verses");
    assert!(
        john3[15].text.contains("God so loved the world"),
        "John 3:16 text unexpected: {}",
        john3[15].text
    );

    let php4 = db::chapter(&conn, TRANSLATION_ID, "PHP", 4).expect("query Philippians 4");
    assert_eq!(php4.len(), 23, "Philippians 4 should have 23 verses");

    // Every book the frontend expects must be present under its USFM code.
    let books = db::books(&conn, TRANSLATION_ID).expect("query books");
    assert_eq!(books.len(), 66, "expected the 66-book canon");
    for code in ["JHN", "PHP", "MRK", "JAS", "1JN", "2JN", "3JN", "SNG", "EZK", "JOL", "NAM"] {
        assert!(
            books.iter().any(|b| b.book_id == code),
            "book {code} missing after import"
        );
    }

    // --- full-text search --------------------------------------------------
    let expression = db::to_match_expression("everlasting life");
    let hits = db::search(&conn, TRANSLATION_ID, &expression, 20).expect("search");
    assert!(!hits.is_empty(), "FTS returned nothing for a phrase that exists");
    assert!(
        hits.iter().any(|v| v.book_id == "JHN" && v.chapter == 3 && v.verse == 16),
        "John 3:16 should rank among matches for 'everlasting life'"
    );

    // --- uninstall leaves nothing behind -----------------------------------
    db::uninstall(&mut conn, TRANSLATION_ID).expect("uninstall");
    assert!(db::chapter(&conn, TRANSLATION_ID, "JHN", 3).unwrap().is_empty());
    assert!(db::search(&conn, TRANSLATION_ID, &expression, 20).unwrap().is_empty());

    let _ = std::fs::remove_dir_all(&dir);
}
