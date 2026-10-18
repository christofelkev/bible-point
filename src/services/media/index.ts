import { isTauri } from '../platform'
import type { Background, Theme, Typography } from '../../types/theme'

/** What the app is willing to copy into its own storage. */
export type AssetKind = 'background' | 'font'

/** Refuse absurdly large files rather than stalling the app copying them. */
const MAX_BYTES: Record<AssetKind, number> = {
  background: 96 * 1024 * 1024,
  font: 16 * 1024 * 1024,
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']
const VIDEO_EXTENSIONS = ['mp4', 'webm']

function extensionOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

export function isVideoFile(name: string): boolean {
  return VIDEO_EXTENSIONS.includes(extensionOf(name))
}

/**
 * Copies a file into app storage and returns a URL plus its stable path.
 *
 * On the desktop the app owns a copy, because a theme now outlives the session
 * that created it and the original may be on a USB stick that is gone by
 * Sunday. In the browser there is nowhere to copy to, so the caller gets an
 * object URL and no path — which is the signal that it will not survive.
 */
async function storeFile(
  kind: AssetKind,
  file: File,
): Promise<{ src: string; path?: string }> {
  if (file.size > MAX_BYTES[kind]) {
    const limit = MAX_BYTES[kind] / 1_048_576
    throw new Error(
      `Berkas terlalu besar (${(file.size / 1_048_576).toFixed(1)} MB). Batasnya ${limit} MB.`,
    )
  }

  if (!isTauri()) {
    return { src: URL.createObjectURL(file) }
  }

  const { invoke, convertFileSrc } = await import('@tauri-apps/api/core')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const path = await invoke<string>('import_asset', { kind, fileName: file.name, bytes })

  return { src: convertFileSrc(path), path }
}

/** Turns a picked image or video into a background a theme can hold. */
export async function importBackgroundFile(file: File): Promise<Background> {
  const extension = extensionOf(file.name)
  if (![...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].includes(extension)) {
    throw new Error(
      `Format .${extension || '?'} tidak didukung. Gunakan: ${[...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].join(', ')}`,
    )
  }

  const { src, path } = await storeFile('background', file)
  const kind = isVideoFile(file.name) ? 'video' : 'image'

  return { kind, src, path, fit: 'cover', label: file.name }
}

/**
 * Registers an operator-supplied font.
 *
 * The family name is derived from the file name because a font file's internal
 * name is not readable without parsing the font tables, and the operator only
 * needs something recognisable in the picker.
 */
export async function importFontFile(file: File): Promise<Partial<Typography>> {
  const extension = extensionOf(file.name)
  if (!['ttf', 'otf', 'woff', 'woff2'].includes(extension)) {
    throw new Error(`Format .${extension || '?'} tidak didukung. Gunakan: ttf, otf, woff, woff2`)
  }

  const { src, path } = await storeFile('font', file)
  const family = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Font Kustom'

  return { fontFamily: family, fontSrc: src, fontPath: path }
}

/**
 * True for a reference that cannot outlive the page that made it.
 *
 * Restored themes are checked against this so a background that silently died
 * over a restart is caught here rather than appearing as a black screen on the
 * projector.
 */
export function isTemporaryReference(src: string): boolean {
  return src.startsWith('blob:')
}

/**
 * Rebuilds a restored theme so its stored files are loadable again.
 *
 * A stored path is turned back into an asset URL — that URL form differs
 * between runs, so only the path is worth persisting. Anything that has no path
 * and only a dead object URL cannot be recovered, so the background falls back
 * to a plain colour and a custom font falls back to a built-in, rather than
 * rendering nothing on the projector.
 */
export async function rehydrateBackground(background: Background): Promise<Background> {
  const convert = isTauri()
    ? (await import('@tauri-apps/api/core')).convertFileSrc
    : null

  if (background.kind === 'image' || background.kind === 'video') {
    if (background.path && convert) {
      return { ...background, src: convert(background.path) }
    } else if (isTemporaryReference(background.src)) {
      return { kind: 'solid', color: '#0b1224' }
    }
  }
  return background
}

export async function rehydrateTheme(theme: Theme): Promise<Theme> {
  const convert = isTauri()
    ? (await import('@tauri-apps/api/core')).convertFileSrc
    : null

  const background = await rehydrateBackground(theme.background)

  let typography = theme.typography
  if (typography.fontSrc) {
    if (typography.fontPath && convert) {
      typography = { ...typography, fontSrc: convert(typography.fontPath) }
    } else if (isTemporaryReference(typography.fontSrc)) {
      const { fontSrc: _dropped, fontPath: _alsoDropped, ...rest } = typography
      typography = { ...rest, fontFamily: 'Inter' }
    }
  }

  return { ...theme, background, typography }
}

/**
 * Deletes stored files no theme points at any more.
 *
 * Without this, every background the operator ever tried would stay on disk
 * forever. The frontend decides what is live because it owns the theme schema;
 * the backend only acts on the list it is given.
 */
export async function pruneUnusedAssets(themes: Theme[]): Promise<number> {
  if (!isTauri()) return 0

  const backgrounds: string[] = []
  const fonts: string[] = []

  for (const theme of themes) {
    if ('path' in theme.background && theme.background.path) {
      backgrounds.push(theme.background.path)
    }
    if (theme.typography.fontPath) fonts.push(theme.typography.fontPath)
  }

  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<number>('prune_assets', { backgrounds, fonts })
}
