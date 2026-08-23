pub mod catalog;
pub mod db;
pub mod install;
pub mod media;
pub mod model;
pub mod settings;

use std::collections::HashSet;
use std::sync::Mutex;

use rusqlite::Connection;
use tauri::{AppHandle, Manager, State, WindowEvent};

use model::{BookSummary, Translation, Verse};

/// Label of the projection window created by the frontend.
///
/// Kept in sync with `OUTPUT_WINDOW_LABEL` in
/// `src/services/projection/outputWindow.ts` and with the capability list in
/// `capabilities/default.json`.
const OUTPUT_LABEL: &str = "output";

/// Guards the single SQLite connection shared by every command.
struct Db(Mutex<Connection>);

fn map_sql<T>(result: rusqlite::Result<T>) -> Result<T, String> {
    result.map_err(|e| format!("kesalahan basis data: {e}"))
}

#[tauri::command]
fn list_installed(db: State<'_, Db>) -> Result<Vec<Translation>, String> {
    let conn = db.0.lock().map_err(|_| "basis data sedang sibuk".to_string())?;
    map_sql(db::list_installed(&conn))
}

/// Installed translations merged with everything the catalog offers.
///
/// Falls back to the installed list alone when the catalog is unreachable, so
/// an offline machine still works with the packs it already has — which is the
/// whole point of installing them.
#[tauri::command]
async fn list_catalog(db: State<'_, Db>) -> Result<Vec<Translation>, String> {
    let (installed, installed_ids) = {
        let conn = db.0.lock().map_err(|_| "basis data sedang sibuk".to_string())?;
        let installed = map_sql(db::list_installed(&conn))?;
        let ids: HashSet<String> = installed.iter().map(|t| t.id.clone()).collect();
        (installed, ids)
    };

    match catalog::fetch(&installed_ids).await {
        Ok(mut remote) => {
            // Prefer the local row for anything installed: it carries the real
            // on-disk size and the verse count actually imported.
            remote.retain(|t| !installed_ids.contains(&t.id));
            remote.extend(installed);
            remote.sort_by(|a, b| {
                b.installed
                    .cmp(&a.installed)
                    .then(a.language_name.cmp(&b.language_name))
                    .then(a.name.cmp(&b.name))
            });
            Ok(remote)
        }
        Err(_) => Ok(installed),
    }
}

#[tauri::command]
fn get_books(db: State<'_, Db>, translation_id: String) -> Result<Vec<BookSummary>, String> {
    let conn = db.0.lock().map_err(|_| "basis data sedang sibuk".to_string())?;
    map_sql(db::books(&conn, &translation_id))
}

#[tauri::command]
fn get_chapter(
    db: State<'_, Db>,
    translation_id: String,
    book_id: String,
    chapter: i64,
) -> Result<Vec<Verse>, String> {
    let conn = db.0.lock().map_err(|_| "basis data sedang sibuk".to_string())?;
    map_sql(db::chapter(&conn, &translation_id, &book_id, chapter))
}

#[tauri::command]
fn search_verses(
    db: State<'_, Db>,
    translation_id: String,
    query: String,
    limit: Option<i64>,
) -> Result<Vec<Verse>, String> {
    let expression = db::to_match_expression(&query);
    if expression.is_empty() {
        return Ok(Vec::new());
    }
    let conn = db.0.lock().map_err(|_| "basis data sedang sibuk".to_string())?;
    map_sql(db::search(&conn, &translation_id, &expression, limit.unwrap_or(100)))
}

/// Downloads a translation and imports it, emitting progress as it goes.
#[tauri::command]
async fn install_translation(
    app: AppHandle,
    db: State<'_, Db>,
    translation_id: String,
) -> Result<Translation, String> {
    let installed_ids = HashSet::new();
    let entry = catalog::fetch(&installed_ids)
        .await?
        .into_iter()
        .find(|t| t.id == translation_id)
        .ok_or_else(|| format!("terjemahan '{translation_id}' tidak ada di katalog"))?;

    let archive = install::download(&app, &translation_id).await?;
    let size_bytes = archive.len() as i64;

    let body = install::extract_vpl(&archive, &translation_id)?;
    let verses = install::parse_vpl(&body);
    if verses.is_empty() {
        return Err("berkas terjemahan tidak memuat ayat yang bisa dibaca".into());
    }

    {
        let mut conn = db.0.lock().map_err(|_| "basis data sedang sibuk".to_string())?;
        install::import(&install::emitter(&app, &translation_id), &mut conn, &entry, &verses, size_bytes)?;
    }

    let conn = db.0.lock().map_err(|_| "basis data sedang sibuk".to_string())?;
    map_sql(db::list_installed(&conn))?
        .into_iter()
        .find(|t| t.id == translation_id)
        .ok_or_else(|| "pemasangan selesai tetapi terjemahan tidak ditemukan".into())
}

/// Reads persisted UI state. Returns null the first time the app is opened.
#[tauri::command]
fn load_settings(app: AppHandle) -> Result<Option<String>, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    settings::load(&settings::path(dir))
}

#[tauri::command]
fn save_settings(app: AppHandle, contents: String) -> Result<(), String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    settings::save(&settings::path(dir), &contents)
}

/// Copies a chosen background or font into app storage, returning its path.
///
/// The frontend then renders it through the asset protocol, so the reference
/// survives a restart where a browser object URL would not.
#[tauri::command]
fn import_asset(
    app: AppHandle,
    kind: String,
    file_name: String,
    bytes: Vec<u8>,
) -> Result<String, String> {
    let kind = media::AssetKind::parse(&kind).ok_or("jenis berkas tidak dikenal")?;
    let root = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = media::import_asset(&media::dir(&root, kind), kind, &file_name, &bytes)?;
    Ok(path.to_string_lossy().into_owned())
}

/// Deletes stored backgrounds and fonts that no theme references any more.
///
/// The frontend owns the list of live references, since it owns the theme
/// schema; this only acts on what it is told to keep.
#[tauri::command]
fn prune_assets(
    app: AppHandle,
    backgrounds: Vec<String>,
    fonts: Vec<String>,
) -> Result<usize, String> {
    let root = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let removed = media::prune(&media::dir(&root, media::AssetKind::Background), &backgrounds)?
        + media::prune(&media::dir(&root, media::AssetKind::Font), &fonts)?;
    Ok(removed)
}

/// Metadata the operator supplies when sideloading, since a bare verse-per-line
/// file carries none of it.
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct SideloadMeta {
    id: String,
    name: String,
    abbrev: String,
    language: String,
    language_name: String,
    license: String,
}

/// Installs a translation from a file the operator provides.
///
/// This is the legitimate route for texts the catalog cannot carry — a church's
/// own licensed copy, or a translation with no online distribution. The app
/// never fetches these; it only imports what it is handed.
#[tauri::command]
async fn sideload_translation(
    app: AppHandle,
    db: State<'_, Db>,
    file_name: String,
    bytes: Vec<u8>,
    meta: SideloadMeta,
) -> Result<Translation, String> {
    let body = install::read_local_pack(&bytes, &file_name)?;
    let verses = install::parse_vpl(&body);
    if verses.is_empty() {
        return Err(
            "tidak ada ayat yang terbaca. Berkas harus berformat verse-per-line,              satu baris per ayat seperti: JHN 3:16 Karena Allah..."
                .into(),
        );
    }

    // A sideloaded id must never collide with a catalog id, or a later catalog
    // install would silently overwrite the operator's own copy.
    let id = if meta.id.starts_with("local-") {
        meta.id.clone()
    } else {
        format!("local-{}", meta.id)
    };

    let entry = Translation {
        id,
        name: meta.name,
        abbrev: meta.abbrev,
        language: meta.language,
        language_name: meta.language_name,
        license: meta.license,
        year: None,
        installed: true,
        verse_count: verses.len() as i64,
        has_old_testament: false,
        has_new_testament: false,
        size_bytes: Some(bytes.len() as i64),
        source_url: None,
    };

    {
        let mut conn = db.0.lock().map_err(|_| "basis data sedang sibuk".to_string())?;
        install::import(
            &install::emitter(&app, &entry.id),
            &mut conn,
            &entry,
            &verses,
            bytes.len() as i64,
        )?;
    }

    let conn = db.0.lock().map_err(|_| "basis data sedang sibuk".to_string())?;
    map_sql(db::list_installed(&conn))?
        .into_iter()
        .find(|t| t.id == entry.id)
        .ok_or_else(|| "pemasangan selesai tetapi terjemahan tidak ditemukan".into())
}

/// Writes a preset bundle to a path the operator chose in a native save dialog.
#[tauri::command]
fn write_text_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| format!("gagal menulis berkas: {e}"))
}

/// Reads a preset bundle from a path the operator chose in a native open dialog.
#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| format!("gagal membaca berkas: {e}"))
}

#[tauri::command]
fn uninstall_translation(db: State<'_, Db>, translation_id: String) -> Result<(), String> {
    let mut conn = db.0.lock().map_err(|_| "basis data sedang sibuk".to_string())?;
    map_sql(db::uninstall(&mut conn, &translation_id))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let path = app.path().app_data_dir()?.join("bible.db");
            let conn = db::open(&path)?;
            app.manage(Db(Mutex::new(conn)));

            Ok(())
        })
        .on_window_event(|window, event| {
            // Closing the control window must take the projection window with
            // it. Without this the output window survives as an orphaned
            // fullscreen black rectangle on the second display, which the
            // operator then has no UI left to dismiss.
            if window.label() == "main" {
                if let WindowEvent::CloseRequested { .. } | WindowEvent::Destroyed = event {
                    if let Some(output) = window.app_handle().get_webview_window(OUTPUT_LABEL) {
                        let _ = output.close();
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            list_installed,
            list_catalog,
            get_books,
            get_chapter,
            search_verses,
            install_translation,
            uninstall_translation,
            load_settings,
            save_settings,
            import_asset,
            prune_assets,
            sideload_translation,
            write_text_file,
            read_text_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
