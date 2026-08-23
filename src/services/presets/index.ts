import { isTauri } from '../platform'
import type { Theme } from '../../types/theme'

const BUNDLE_KIND = 'bible-point/theme-presets'
const BUNDLE_VERSION = 1

interface PresetBundle {
  kind: typeof BUNDLE_KIND
  version: number
  exportedAt: string
  themes: Theme[]
}

/**
 * Result of an import, so the caller can tell the operator what happened
 * rather than silently changing their preset list.
 */
export interface ImportResult {
  themes: Theme[]
  skipped: number
}

/**
 * Writes the operator's presets to a file they choose.
 *
 * Churches commonly run one machine in the sanctuary and prepare on another;
 * without this, a look built on one has to be rebuilt by hand on the other.
 *
 * Returns the chosen path, or null if the operator cancelled.
 */
export async function exportPresets(themes: Theme[]): Promise<string | null> {
  const bundle: PresetBundle = {
    kind: BUNDLE_KIND,
    version: BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),
    // Built-ins ship with the app on the other machine too, so sending them
    // would only risk overwriting newer versions with older copies.
    themes: themes.filter((t) => !t.builtin),
  }

  const contents = JSON.stringify(bundle, null, 2)

  if (!isTauri()) {
    downloadInBrowser(contents)
    return 'unduhan browser'
  }

  const { save } = await import('@tauri-apps/plugin-dialog')
  const path = await save({
    title: 'Simpan preset tampilan',
    defaultPath: 'bible-point-presets.json',
    filters: [{ name: 'Preset Bible Point', extensions: ['json'] }],
  })
  if (!path) return null

  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('write_text_file', { path, contents })
  return path
}

/**
 * Reads a preset bundle the operator selects.
 *
 * Returns null if they cancelled. Throws with a readable message when the file
 * is not a preset bundle — pointing someone at the wrong JSON file should say
 * so, not fail silently or half-import.
 */
export async function importPresets(): Promise<ImportResult | null> {
  const contents = isTauri() ? await readViaDialog() : await readViaFileInput()
  if (contents === null) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(contents)
  } catch {
    throw new Error('Berkas ini bukan JSON yang valid.')
  }

  const bundle = parsed as Partial<PresetBundle>
  if (bundle.kind !== BUNDLE_KIND) {
    throw new Error('Berkas ini bukan preset Bible Point.')
  }
  if (bundle.version !== BUNDLE_VERSION) {
    throw new Error(`Versi preset ${bundle.version} tidak dikenal oleh aplikasi ini.`)
  }
  if (!Array.isArray(bundle.themes)) {
    throw new Error('Berkas preset tidak memuat daftar tema.')
  }

  // A theme whose background or font lived on the other machine cannot resolve
  // here, so those references are dropped rather than imported broken.
  const themes: Theme[] = []
  let skipped = 0

  for (const theme of bundle.themes) {
    if (!isUsableTheme(theme)) {
      skipped += 1
      continue
    }
    themes.push(stripMachineLocalReferences(theme))
  }

  return { themes, skipped }
}

function isUsableTheme(value: unknown): value is Theme {
  if (typeof value !== 'object' || value === null) return false
  const t = value as Partial<Theme>
  return (
    typeof t.id === 'string' &&
    typeof t.name === 'string' &&
    typeof t.background === 'object' && t.background !== null &&
    typeof t.typography === 'object' && t.typography !== null &&
    typeof t.layout === 'object' && t.layout !== null
  )
}

/**
 * Removes references to files that only exist on the machine that exported.
 *
 * The colours, sizes and layout all travel fine; a background photo does not,
 * because its path names a directory on someone else's computer. Falling back
 * keeps the rest of the preset useful.
 */
function stripMachineLocalReferences(theme: Theme): Theme {
  const background =
    theme.background.kind === 'image' || theme.background.kind === 'video'
      ? ({ kind: 'solid', color: '#0b1224' } as const)
      : theme.background

  const { fontSrc: _src, fontPath: _path, ...typography } = theme.typography
  const usedCustomFont = Boolean(theme.typography.fontSrc)

  return {
    ...theme,
    // Imported presets are always the operator's own, never built-in.
    builtin: undefined,
    background,
    typography: usedCustomFont ? { ...typography, fontFamily: 'Inter' } : theme.typography,
  }
}

async function readViaDialog(): Promise<string | null> {
  const { open } = await import('@tauri-apps/plugin-dialog')
  const selected = await open({
    title: 'Buka preset tampilan',
    multiple: false,
    filters: [{ name: 'Preset Bible Point', extensions: ['json'] }],
  })
  if (typeof selected !== 'string') return null

  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<string>('read_text_file', { path: selected })
}

/** Browser fallback: a transient file input, since there is no native dialog. */
function readViaFileInput(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      void file.text().then(resolve)
    }
    // A cancelled picker fires no event in every browser, so the promise would
    // otherwise hang; the window regaining focus is the reliable signal.
    window.addEventListener(
      'focus',
      () => setTimeout(() => { if (!input.files?.length) resolve(null) }, 400),
      { once: true },
    )
    input.click()
  })
}

function downloadInBrowser(contents: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'bible-point-presets.json'
  link.click()
  URL.revokeObjectURL(url)
}
