use tauri::{Manager, WindowEvent};

/// Label of the projection window created by the frontend.
///
/// Kept in sync with `OUTPUT_WINDOW_LABEL` in
/// `src/services/projection/outputWindow.ts` and with the capability list in
/// `capabilities/default.json`.
const OUTPUT_LABEL: &str = "output";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
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
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
