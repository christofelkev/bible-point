import { isTauri } from '../platform'
import { MockBibleSource } from './MockBibleSource'
import { TauriBibleSource } from './TauriBibleSource'

export type { BibleSource, InstallProgress, InstallPhase } from './BibleSource'
export { highlightRanges } from './BibleSource'
export { parseReference } from './parseReference'
export { MockBibleSource } from './MockBibleSource'
export { TauriBibleSource } from './TauriBibleSource'

/**
 * The single place the app decides where scripture comes from.
 *
 * Local SQLite packs in the desktop build, sample chapters in the browser.
 * Every caller works against the `BibleSource` interface and is unaware of
 * which one it got.
 */
export const bibleSource = isTauri() ? new TauriBibleSource() : new MockBibleSource()
