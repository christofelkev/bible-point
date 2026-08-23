import { isTauri } from '../platform'
import { isUsable, type PersistedSettings, type SettingsStore } from './SettingsStore'

export type { PersistedSettings, SettingsStore } from './SettingsStore'
export { SETTINGS_VERSION } from './SettingsStore'

const BROWSER_KEY = 'bible-point/settings'

/**
 * Desktop storage: a JSON file in the app data directory, written atomically
 * by the Rust side.
 */
class TauriSettingsStore implements SettingsStore {
  async load(): Promise<PersistedSettings | null> {
    const { invoke } = await import('@tauri-apps/api/core')
    const raw = await invoke<string | null>('load_settings')
    return parse(raw)
  }

  async save(settings: PersistedSettings): Promise<void> {
    const { invoke } = await import('@tauri-apps/api/core')
    await invoke('save_settings', { contents: JSON.stringify(settings) })
  }
}

/** Browser storage, so development mode keeps its presets between reloads. */
class BrowserSettingsStore implements SettingsStore {
  async load(): Promise<PersistedSettings | null> {
    return parse(window.localStorage.getItem(BROWSER_KEY))
  }

  async save(settings: PersistedSettings): Promise<void> {
    try {
      window.localStorage.setItem(BROWSER_KEY, JSON.stringify(settings))
    } catch {
      // A full or disabled localStorage must not break the app; the operator
      // loses persistence in the browser, which desktop mode does not share.
    }
  }
}

/**
 * Parses and validates stored settings.
 *
 * A corrupt or foreign file yields null, which starts the app at its defaults.
 * That loses preferences, but an app that opens is worth more than one that
 * refuses to start ten minutes before a service.
 */
function parse(raw: string | null): PersistedSettings | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return isUsable(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** The single place the app decides where preferences live. */
export const settingsStore: SettingsStore = isTauri()
  ? new TauriSettingsStore()
  : new BrowserSettingsStore()
