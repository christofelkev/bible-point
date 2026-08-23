import { MockBibleSource } from './MockBibleSource'

export type { BibleSource } from './BibleSource'
export { MockBibleSource, parseReference } from './MockBibleSource'

/**
 * The single place the app decides where scripture comes from.
 *
 * When the Tauri backend lands, this becomes:
 *   export const bibleSource = isTauri() ? new TauriBibleSource() : new MockBibleSource()
 * and nothing else in the codebase changes.
 */
export const bibleSource = new MockBibleSource()
