import type { Translation } from '../types/bible'

/**
 * Catalog stand-in for browser development mode.
 *
 * Ids, names and copyright lines are copied from the real eBible.org catalog
 * entries the desktop build installs, so what the operator sees in the browser
 * matches what they will see on the desktop. Only the two with sample text
 * compiled in are marked installed.
 */
export const MOCK_TRANSLATIONS: Translation[] = [
  {
    id: 'indayt', name: 'Alkitab Yang Terbuka', abbrev: 'AYT',
    language: 'ind', languageName: 'Indonesian',
    license: 'Copyright © 2011-2024 YLSA-AYT', year: 2024,
    installed: true, verseCount: 31102,
    hasOldTestament: true, hasNewTestament: true,
    sourceUrl: 'http://ebible.org/indayt/',
  },
  {
    id: 'eng-kjv2006', name: 'King James Version', abbrev: 'KJV2006',
    language: 'eng', languageName: 'English',
    license: 'public domain', year: 2006,
    installed: true, verseCount: 31102,
    hasOldTestament: true, hasNewTestament: true,
    sourceUrl: 'http://ebible.org/eng-kjv2006/',
  },
  {
    id: 'ind', name: 'Alkitab Terjemahan Sederhana Indonesia', abbrev: 'IND',
    language: 'ind', languageName: 'Indonesian',
    license: 'Copyright © 2021 Yayasan Alkitab BahasaKita (Albata)', year: 2021,
    installed: false, verseCount: 20650,
    hasOldTestament: true, hasNewTestament: true,
    sourceUrl: 'http://ebible.org/ind/',
  },
  {
    id: 'indags', name: 'Alkitab Gratis untuk Semua', abbrev: 'AGS',
    language: 'ind', languageName: 'Indonesian',
    license: 'Copyright © 2021-2023 Jonathan Gallagher', year: 2023,
    installed: false, verseCount: 7959,
    hasOldTestament: false, hasNewTestament: true,
    sourceUrl: 'http://ebible.org/indags/',
  },
  {
    id: 'engwebp', name: 'World English Bible', abbrev: 'WEBP',
    language: 'eng', languageName: 'English',
    license: 'public domain', year: 2020,
    installed: false, verseCount: 31103,
    hasOldTestament: true, hasNewTestament: true,
    sourceUrl: 'http://ebible.org/engwebp/',
  },
  {
    id: 'engbsb', name: 'English Berean Standard Bible', abbrev: 'BSB',
    language: 'eng', languageName: 'English',
    license: 'public domain', year: 2023,
    installed: false, verseCount: 31086,
    hasOldTestament: true, hasNewTestament: true,
    sourceUrl: 'http://ebible.org/engbsb/',
  },
]
