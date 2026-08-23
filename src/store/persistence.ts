import { useAppStore } from './useAppStore'
import { settingsStore, SETTINGS_VERSION } from '../services/settings'
import type { PersistedSettings } from '../services/settings'

/**
 * How long to wait after the last change before writing.
 *
 * Dragging a size slider fires a store update per pixel; without this the app
 * would write the settings file hundreds of times per adjustment. Long enough
 * to coalesce a drag, short enough that closing the app right after a change
 * still saves it.
 */
const DEBOUNCE_MS = 600

/** Reduces live app state down to the parts worth keeping. */
function snapshot(state: ReturnType<typeof useAppStore.getState>): PersistedSettings {
  return {
    version: SETTINGS_VERSION,
    // Built-ins ship with the app and may change between versions; persisting
    // them would freeze an old copy and shadow any later improvement.
    customThemes: state.themes.filter((t) => !t.builtin),
    activeThemeId: state.activeThemeId,
    theme: state.theme,
    playlist: state.playlist,
    activeTranslationId: state.activeTranslationId,
    activeBookId: state.activeBookId,
    activeChapter: state.activeChapter,
    selectedMonitorId: state.selectedMonitorId,
  }
}

/**
 * Starts writing settings whenever the persisted slice changes.
 *
 * Must be called *after* hydration, otherwise restoring state would immediately
 * schedule a write of what was just read.
 *
 * Returns an unsubscribe function.
 */
export function startAutosave(): () => void {
  let timer: number | undefined
  let lastWritten = JSON.stringify(snapshot(useAppStore.getState()))

  const unsubscribe = useAppStore.subscribe((state) => {
    const next = snapshot(state)
    const serialised = JSON.stringify(next)

    // Most store updates — search results, live verses, loading flags — touch
    // nothing persisted. Comparing here keeps them from resetting the timer.
    if (serialised === lastWritten) return
    lastWritten = serialised

    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      void settingsStore.save(next)
    }, DEBOUNCE_MS)
  })

  // A pending debounce would be lost if the window closed mid-wait, which is
  // exactly when an operator has just finished adjusting something.
  const flush = () => {
    if (timer === undefined) return
    window.clearTimeout(timer)
    timer = undefined
    void settingsStore.save(snapshot(useAppStore.getState()))
  }
  window.addEventListener('beforeunload', flush)

  return () => {
    unsubscribe()
    window.removeEventListener('beforeunload', flush)
    window.clearTimeout(timer)
  }
}
