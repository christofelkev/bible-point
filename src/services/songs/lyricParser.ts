import type { ProjectionSlide } from '../../types/projection'
import type { SongSection } from '../../types/song'

const HEADER_REGEX = /^\[?([a-zA-Z0-9\s_-]+)\]?:?$/

/** Normalizes section headers to human-friendly badge names */
export function normalizeBadge(raw: string): string {
  const trimmed = raw.trim().replace(/^\[|\]|:$/g, '').trim()
  const lower = trimmed.toLowerCase()

  if (lower.startsWith('verse') || lower.startsWith('bait') || lower.startsWith('v')) {
    const num = trimmed.match(/\d+/)
    return num ? `Verse ${num[0]}` : 'Verse'
  }
  if (lower.startsWith('chorus') || lower.startsWith('reff') || lower.startsWith('ref') || lower === 'c') {
    const num = trimmed.match(/\d+/)
    return num ? `Chorus ${num[0]}` : 'Chorus'
  }
  if (lower.startsWith('pre-chorus') || lower.startsWith('prechorus') || lower.startsWith('pre chorus')) {
    return 'Pre-Chorus'
  }
  if (lower.startsWith('bridge') || lower.startsWith('b')) {
    const num = trimmed.match(/\d+/)
    return num ? `Bridge ${num[0]}` : 'Bridge'
  }
  if (lower.startsWith('tag')) return 'Tag'
  if (lower.startsWith('outro') || lower.startsWith('ending')) return 'Ending'
  if (lower.startsWith('intro')) return 'Intro'

  // Capitalize words
  return trimmed.replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Parses raw lyric text into structured SongSections.
 * Supports bracket headers `[Verse 1]`, colon headers `Chorus:`,
 * and plain blank-line-delimited stanzas.
 */
export function parseRawLyrics(raw: string): SongSection[] {
  const lines = raw.split(/\r?\n/)
  const sections: SongSection[] = []

  let currentLabel: string | null = null
  let currentLines: string[] = []
  let autoVerseIndex = 1

  function flush() {
    const cleanedLines = currentLines.map((l) => l.trim()).filter(Boolean)
    if (cleanedLines.length > 0) {
      const label = currentLabel ?? `Verse ${autoVerseIndex++}`
      sections.push({
        id: `sec-${sections.length + 1}`,
        label,
        lines: cleanedLines,
      })
    }
    currentLines = []
    currentLabel = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Detect section header
    if (
      (line.startsWith('[') && line.endsWith(']')) ||
      (line.endsWith(':') && line.length < 30) ||
      HEADER_REGEX.test(line) && /^(verse|bait|chorus|reff|ref|bridge|pre-chorus|tag|outro|ending|intro)/i.test(line)
    ) {
      flush()
      currentLabel = normalizeBadge(line)
      continue
    }

    // Blank line indicates a split between stanzas if no explicit header was pending
    if (!line) {
      if (currentLines.length > 0) {
        flush()
      }
      continue
    }

    currentLines.push(line)
  }

  flush()
  return sections
}

/**
 * Builds projection slides from sections, with proper metadata and slide progress (e.g. 1/4).
 */
export function compileSongSlides(
  sections: SongSection[],
  meta: { title: string; artist: string; key?: string; ccli?: string },
  arrangement?: string,
): ProjectionSlide[] {
  if (sections.length === 0) return []

  let orderedSections: SongSection[] = []

  // If arrangement string exists e.g. "V1 → C → V2 → C → B → C"
  if (arrangement && arrangement.trim()) {
    const tokens = arrangement
      .split(/→|->|,|\s+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)

    if (tokens.length > 0) {
      for (const token of tokens) {
        // Find matching section
        const found = sections.find((s) => {
          const l = s.label.toLowerCase()
          if (l === token) return true
          if (token === 'v1' && (l === 'verse 1' || l === 'bait 1')) return true
          if (token === 'v2' && (l === 'verse 2' || l === 'bait 2')) return true
          if (token === 'v3' && (l === 'verse 3' || l === 'bait 3')) return true
          if (token === 'v4' && (l === 'verse 4' || l === 'bait 4')) return true
          if (token === 'c' && (l.startsWith('chorus') || l.startsWith('reff'))) return true
          if (token === 'c1' && (l === 'chorus 1' || l === 'reff 1')) return true
          if (token === 'c2' && (l === 'chorus 2' || l === 'reff 2')) return true
          if (token === 'b' && l.startsWith('bridge')) return true
          if (token === 'tag' && l.startsWith('tag')) return true
          if (token === 'outro' && (l.startsWith('outro') || l.startsWith('ending'))) return true
          return l.includes(token)
        })

        if (found) {
          orderedSections.push(found)
        }
      }
    }
  }

  // Fallback to sequential if arrangement produced nothing or wasn't provided
  if (orderedSections.length === 0) {
    orderedSections = sections
  }

  const total = orderedSections.length
  const refText = meta.artist ? `${meta.title} — ${meta.artist}` : meta.title
  const secMeta = meta.key ? `Key: ${meta.key}` : undefined

  return orderedSections.map((sec, idx) => ({
    kind: 'song',
    badge: sec.label,
    reference: refText,
    secondaryMeta: secMeta,
    slideProgress: `${idx + 1}/${total}`,
    lines: sec.lines,
  }))
}
