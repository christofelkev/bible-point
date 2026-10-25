export interface SongGroupDef {
  name: string
  defaultKey: string
  color: 'blue' | 'amber' | 'purple' | 'yellow' | 'emerald' | 'slate' | 'rose'
}

export const DEFAULT_SONG_GROUPS: SongGroupDef[] = [
  { name: 'Verse 1', defaultKey: 'A', color: 'blue' },
  { name: 'Verse 2', defaultKey: 'S', color: 'blue' },
  { name: 'Verse 3', defaultKey: 'D', color: 'blue' },
  { name: 'Chorus 1', defaultKey: 'C', color: 'amber' },
  { name: 'Chorus 2', defaultKey: 'X', color: 'amber' },
  { name: 'Bridge', defaultKey: 'B', color: 'purple' },
  { name: 'Pre-Chorus', defaultKey: 'P', color: 'yellow' },
  { name: 'Tag', defaultKey: 'T', color: 'emerald' },
  { name: 'Intro', defaultKey: 'I', color: 'slate' },
  { name: 'Ending', defaultKey: 'E', color: 'rose' },
]

export const DEFAULT_SECTION_HOTKEYS: Record<string, string> = {
  'Verse 1': 'A',
  'Verse 2': 'S',
  'Verse 3': 'D',
  'Chorus 1': 'C',
  'Chorus 2': 'X',
  'Bridge': 'B',
  'Pre-Chorus': 'P',
  'Tag': 'T',
  'Intro': 'I',
  'Ending': 'E',
}

export function getGroupColorClasses(badge?: string): string {
  if (!badge) return 'bg-ink-800 text-ink-300 border-ink-700'
  const b = badge.toLowerCase()
  if (b.includes('chorus 1') || b === 'chorus' || b.includes('reff 1') || b === 'reff') {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  }
  if (b.includes('chorus 2') || b.includes('reff 2') || b.includes('chorus')) {
    return 'bg-amber-500/30 text-amber-200 border-amber-400/50'
  }
  if (b.includes('bridge')) {
    return 'bg-purple-500/20 text-purple-300 border-purple-500/40'
  }
  if (b.includes('pre-chorus') || b.includes('prechorus')) {
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
  }
  if (b.includes('verse') || b.includes('bait')) {
    return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
  }
  if (b.includes('tag')) {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  }
  if (b.includes('intro')) {
    return 'bg-slate-500/20 text-slate-300 border-slate-500/40'
  }
  if (b.includes('ending') || b.includes('outro')) {
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  }
  return 'bg-ink-800 text-ink-300 border-ink-700'
}
