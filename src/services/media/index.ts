import { isTauri } from '../platform'
import type { Background, ImageBackground } from '../../types/theme'

/** Refuse absurdly large images rather than stalling the app copying them. */
const MAX_BYTES = 24 * 1024 * 1024

/**
 * Takes an image the operator picked and returns something a theme can hold.
 *
 * On the desktop the file is copied into app storage and referenced by path,
 * because a theme now outlives the session that created it. In the browser
 * there is nowhere to copy it to, so an object URL is used and the caller is
 * told the reference is temporary.
 */
export async function importBackgroundImage(file: File): Promise<ImageBackground> {
  if (file.size > MAX_BYTES) {
    throw new Error(
      `Gambar terlalu besar (${(file.size / 1_048_576).toFixed(1)} MB). Batasnya 24 MB.`,
    )
  }

  if (!isTauri()) {
    return { kind: 'image', src: URL.createObjectURL(file), fit: 'cover', label: file.name }
  }

  const { invoke, convertFileSrc } = await import('@tauri-apps/api/core')

  const bytes = new Uint8Array(await file.arrayBuffer())
  const path = await invoke<string>('import_background', { fileName: file.name, bytes })

  return { kind: 'image', src: convertFileSrc(path), fit: 'cover', label: file.name, path }
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
 * Rebuilds a restored background so its image is loadable again.
 *
 * A stored `path` is turned back into an asset URL — the URL form differs
 * between runs, so only the path is worth persisting. A background that has no
 * path and only a dead object URL cannot be recovered, so it falls back to a
 * plain colour instead of rendering nothing.
 */
export async function rehydrateBackground(background: Background): Promise<Background> {
  if (background.kind !== 'image') return background

  if (background.path && isTauri()) {
    const { convertFileSrc } = await import('@tauri-apps/api/core')
    return { ...background, src: convertFileSrc(background.path) }
  }

  if (isTemporaryReference(background.src)) {
    return { kind: 'solid', color: '#0b1224' }
  }

  return background
}
