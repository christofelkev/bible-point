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

/**
 * Checks whether the application window is currently in fullscreen mode.
 */
export async function isAppFullscreen(): Promise<boolean> {
  if (isTauri()) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      return await getCurrentWindow().isFullscreen()
    } catch {
      return false
    }
  }
  return typeof document !== 'undefined' && !!document.fullscreenElement
}

/**
 * Toggles the application between fullscreen and windowed mode.
 */
export async function toggleAppFullscreen(): Promise<boolean> {
  if (isTauri()) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow()
      const current = await win.isFullscreen()
      await win.setFullscreen(!current)
      return !current
    } catch {
      return false
    }
  }

  try {
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        return true
      } else {
        await document.exitFullscreen()
        return false
      }
    }
  } catch {
    return false
  }
  return false
}

