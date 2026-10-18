import type { Background, Theme } from '../../types/theme'
import type { PlaylistItem } from '../../store/useAppStore'

/**
 * Bumped whenever the persisted shape changes incompatibly.
 *
 * Loading refuses anything it does not recognise and starts fresh, which loses
 * settings but never crashes the app on a file written by a newer build.
 */
export const SETTINGS_VERSION = 1

/**
 * What survives a restart.
 *
 * Deliberately not everything: live projection state (what is on screen, which
 * verses are selected) is intentionally dropped, because an app reopened on
 * Sunday morning should start from a blank screen rather than resume whatever
 * was projected when it was last closed.
 */
export interface PersistedSettings {
  version: number
  /** Operator-created presets only; built-ins come from code. */
  customThemes: Theme[]
  activeThemeId: string
  /** The working theme, including edits never saved as a preset. */
  theme: Theme
  playlist: PlaylistItem[]
  activeTranslationId: string
  activeBookId: string
  activeChapter: number
  selectedMonitorId: string | null
  workspaceMode?: 'bible' | 'live'
  mediaLibrary?: Background[]
}

export interface SettingsStore {
  /** Returns null when nothing has been saved yet, or the file is unusable. */
  load(): Promise<PersistedSettings | null>
  save(settings: PersistedSettings): Promise<void>
}

/**
 * Validates a parsed settings blob before the app trusts it.
 *
 * The file can be hand-edited, written by a different version, or truncated by
 * a crash. Anything unexpected is rejected wholesale rather than partially
 * applied, since half-restored state is harder to diagnose than none.
 */
export function isUsable(value: unknown): value is PersistedSettings {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Partial<PersistedSettings>

  return (
    s.version === SETTINGS_VERSION &&
    Array.isArray(s.customThemes) &&
    Array.isArray(s.playlist) &&
    typeof s.activeThemeId === 'string' &&
    typeof s.theme === 'object' && s.theme !== null &&
    typeof s.activeTranslationId === 'string' &&
    typeof s.activeBookId === 'string' &&
    typeof s.activeChapter === 'number'
  )
}
