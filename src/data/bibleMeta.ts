import type { Book, Translation } from '../types/bible'

/**
 * Catalog + book metadata for the mock Bible source.
 *
 * Once Bible packs are downloadable this file is replaced by the local catalog
 * that ships with each pack; the shapes stay identical so the UI does not change.
 */

export const MOCK_TRANSLATIONS: Translation[] = [
  {
    id: 'id-tl', name: 'Terjemahan Lama', abbrev: 'TL', language: 'id',
    languageName: 'Bahasa Indonesia', license: 'Public Domain', year: 1958,
    installed: true, sizeBytes: 4_512_000,
  },
  {
    id: 'en-kjv', name: 'King James Version', abbrev: 'KJV', language: 'en',
    languageName: 'English', license: 'Public Domain', year: 1611,
    installed: true, sizeBytes: 4_318_000,
  },
  {
    id: 'id-tb', name: 'Terjemahan Baru', abbrev: 'TB', language: 'id',
    languageName: 'Bahasa Indonesia', license: 'Lembaga Alkitab Indonesia', year: 1974,
    installed: false, sizeBytes: 4_688_000,
  },
  {
    id: 'id-ayt', name: 'Alkitab Yang Terbuka', abbrev: 'AYT', language: 'id',
    languageName: 'Bahasa Indonesia', license: 'Yayasan Lembaga SABDA', year: 2018,
    installed: false, sizeBytes: 4_740_000,
  },
  {
    id: 'id-bis', name: 'Bahasa Indonesia Sehari-hari', abbrev: 'BIS', language: 'id',
    languageName: 'Bahasa Indonesia', license: 'Lembaga Alkitab Indonesia', year: 1985,
    installed: false, sizeBytes: 4_402_000,
  },
  {
    id: 'en-web', name: 'World English Bible', abbrev: 'WEB', language: 'en',
    languageName: 'English', license: 'Public Domain', year: 2000,
    installed: false, sizeBytes: 4_390_000,
  },
  {
    id: 'en-asv', name: 'American Standard Version', abbrev: 'ASV', language: 'en',
    languageName: 'English', license: 'Public Domain', year: 1901,
    installed: false, sizeBytes: 4_275_000,
  },
]

/** Book names per language, so the navigator localises with the translation. */
const BOOK_NAMES: Record<string, Record<string, string>> = {
  id: {
    GEN: 'Kejadian', EXO: 'Keluaran', LEV: 'Imamat', NUM: 'Bilangan', DEU: 'Ulangan',
    JOS: 'Yosua', JDG: 'Hakim-hakim', RUT: 'Rut', PSA: 'Mazmur', PRO: 'Amsal',
    ISA: 'Yesaya', JER: 'Yeremia', MAT: 'Matius', MRK: 'Markus', LUK: 'Lukas',
    JHN: 'Yohanes', ACT: 'Kisah Para Rasul', ROM: 'Roma', '1CO': '1 Korintus',
    '2CO': '2 Korintus', GAL: 'Galatia', EPH: 'Efesus', PHP: 'Filipi', COL: 'Kolose',
    HEB: 'Ibrani', JAS: 'Yakobus', '1PE': '1 Petrus', '1JN': '1 Yohanes', REV: 'Wahyu',
  },
  en: {
    GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers', DEU: 'Deuteronomy',
    JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth', PSA: 'Psalms', PRO: 'Proverbs',
    ISA: 'Isaiah', JER: 'Jeremiah', MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke',
    JHN: 'John', ACT: 'Acts', ROM: 'Romans', '1CO': '1 Corinthians',
    '2CO': '2 Corinthians', GAL: 'Galatians', EPH: 'Ephesians', PHP: 'Philippians',
    COL: 'Colossians', HEB: 'Hebrews', JAS: 'James', '1PE': '1 Peter',
    '1JN': '1 John', REV: 'Revelation',
  },
}

const BOOK_ABBREV: Record<string, Record<string, string>> = {
  id: {
    GEN: 'Kej', EXO: 'Kel', LEV: 'Ima', NUM: 'Bil', DEU: 'Ul', JOS: 'Yos', JDG: 'Hak',
    RUT: 'Rut', PSA: 'Mzm', PRO: 'Ams', ISA: 'Yes', JER: 'Yer', MAT: 'Mat', MRK: 'Mrk',
    LUK: 'Luk', JHN: 'Yoh', ACT: 'Kis', ROM: 'Rom', '1CO': '1Kor', '2CO': '2Kor',
    GAL: 'Gal', EPH: 'Ef', PHP: 'Flp', COL: 'Kol', HEB: 'Ibr', JAS: 'Yak',
    '1PE': '1Ptr', '1JN': '1Yoh', REV: 'Why',
  },
  en: {
    GEN: 'Gen', EXO: 'Exo', LEV: 'Lev', NUM: 'Num', DEU: 'Deu', JOS: 'Jos', JDG: 'Jdg',
    RUT: 'Rut', PSA: 'Psa', PRO: 'Pro', ISA: 'Isa', JER: 'Jer', MAT: 'Mat', MRK: 'Mrk',
    LUK: 'Luk', JHN: 'Jhn', ACT: 'Act', ROM: 'Rom', '1CO': '1Co', '2CO': '2Co',
    GAL: 'Gal', EPH: 'Eph', PHP: 'Php', COL: 'Col', HEB: 'Heb', JAS: 'Jas',
    '1PE': '1Pe', '1JN': '1Jn', REV: 'Rev',
  },
}

const BOOK_META: Array<{ id: string; testament: 'OT' | 'NT'; chapters: number }> = [
  { id: 'GEN', testament: 'OT', chapters: 50 },
  { id: 'EXO', testament: 'OT', chapters: 40 },
  { id: 'LEV', testament: 'OT', chapters: 27 },
  { id: 'NUM', testament: 'OT', chapters: 36 },
  { id: 'DEU', testament: 'OT', chapters: 34 },
  { id: 'JOS', testament: 'OT', chapters: 24 },
  { id: 'JDG', testament: 'OT', chapters: 21 },
  { id: 'RUT', testament: 'OT', chapters: 4 },
  { id: 'PSA', testament: 'OT', chapters: 150 },
  { id: 'PRO', testament: 'OT', chapters: 31 },
  { id: 'ISA', testament: 'OT', chapters: 66 },
  { id: 'JER', testament: 'OT', chapters: 52 },
  { id: 'MAT', testament: 'NT', chapters: 28 },
  { id: 'MRK', testament: 'NT', chapters: 16 },
  { id: 'LUK', testament: 'NT', chapters: 24 },
  { id: 'JHN', testament: 'NT', chapters: 21 },
  { id: 'ACT', testament: 'NT', chapters: 28 },
  { id: 'ROM', testament: 'NT', chapters: 16 },
  { id: '1CO', testament: 'NT', chapters: 16 },
  { id: '2CO', testament: 'NT', chapters: 13 },
  { id: 'GAL', testament: 'NT', chapters: 6 },
  { id: 'EPH', testament: 'NT', chapters: 6 },
  { id: 'PHP', testament: 'NT', chapters: 4 },
  { id: 'COL', testament: 'NT', chapters: 4 },
  { id: 'HEB', testament: 'NT', chapters: 13 },
  { id: 'JAS', testament: 'NT', chapters: 5 },
  { id: '1PE', testament: 'NT', chapters: 5 },
  { id: '1JN', testament: 'NT', chapters: 5 },
  { id: 'REV', testament: 'NT', chapters: 22 },
]

/** Builds the book list for a language, falling back to English names. */
export function booksFor(language: string): Book[] {
  const names = BOOK_NAMES[language] ?? BOOK_NAMES.en
  const abbrevs = BOOK_ABBREV[language] ?? BOOK_ABBREV.en
  return BOOK_META.map((b) => ({
    id: b.id,
    name: names[b.id] ?? b.id,
    abbrev: abbrevs[b.id] ?? b.id,
    testament: b.testament,
    chapterCount: b.chapters,
  }))
}

export function bookNameFor(language: string, bookId: string): string {
  return (BOOK_NAMES[language] ?? BOOK_NAMES.en)[bookId] ?? bookId
}
