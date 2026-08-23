/**
 * Whether the app is running inside the Tauri shell rather than a plain browser.
 *
 * Tauri injects `__TAURI_INTERNALS__` before any application code runs, so this
 * is safe to call at module scope. The check exists so the same bundle can be
 * developed in a browser and shipped in the desktop shell.
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
