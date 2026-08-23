import type { Book, TestamentId } from '../types/bible'

/**
 * Book naming and canonical structure.
 *
 * Verse content comes from installed packs, but book *names* stay here: a pack
 * ships USFM book codes (GEN, 1CO, REV), not localised titles, so the app is
 * what turns `JHN` into "Yohanes" or "John".
 *
 * `chapters` is the canonical count, used only by the mock source and as a
 * fallback. The Tauri source reports the chapter count actually present in the
 * installed pack, which matters for New Testament-only translations.
 */

interface BookMeta {
  id: string
  testament: TestamentId
  chapters: number
  id_name: string
  id_abbrev: string
  en_name: string
  en_abbrev: string
}

const BOOKS: BookMeta[] = [
  { id: 'GEN', testament: 'OT', chapters: 50, id_name: 'Kejadian', id_abbrev: 'Kej', en_name: 'Genesis', en_abbrev: 'Gen' },
  { id: 'EXO', testament: 'OT', chapters: 40, id_name: 'Keluaran', id_abbrev: 'Kel', en_name: 'Exodus', en_abbrev: 'Exo' },
  { id: 'LEV', testament: 'OT', chapters: 27, id_name: 'Imamat', id_abbrev: 'Ima', en_name: 'Leviticus', en_abbrev: 'Lev' },
  { id: 'NUM', testament: 'OT', chapters: 36, id_name: 'Bilangan', id_abbrev: 'Bil', en_name: 'Numbers', en_abbrev: 'Num' },
  { id: 'DEU', testament: 'OT', chapters: 34, id_name: 'Ulangan', id_abbrev: 'Ul', en_name: 'Deuteronomy', en_abbrev: 'Deu' },
  { id: 'JOS', testament: 'OT', chapters: 24, id_name: 'Yosua', id_abbrev: 'Yos', en_name: 'Joshua', en_abbrev: 'Jos' },
  { id: 'JDG', testament: 'OT', chapters: 21, id_name: 'Hakim-hakim', id_abbrev: 'Hak', en_name: 'Judges', en_abbrev: 'Jdg' },
  { id: 'RUT', testament: 'OT', chapters: 4, id_name: 'Rut', id_abbrev: 'Rut', en_name: 'Ruth', en_abbrev: 'Rut' },
  { id: '1SA', testament: 'OT', chapters: 31, id_name: '1 Samuel', id_abbrev: '1Sam', en_name: '1 Samuel', en_abbrev: '1Sa' },
  { id: '2SA', testament: 'OT', chapters: 24, id_name: '2 Samuel', id_abbrev: '2Sam', en_name: '2 Samuel', en_abbrev: '2Sa' },
  { id: '1KI', testament: 'OT', chapters: 22, id_name: '1 Raja-raja', id_abbrev: '1Raj', en_name: '1 Kings', en_abbrev: '1Ki' },
  { id: '2KI', testament: 'OT', chapters: 25, id_name: '2 Raja-raja', id_abbrev: '2Raj', en_name: '2 Kings', en_abbrev: '2Ki' },
  { id: '1CH', testament: 'OT', chapters: 29, id_name: '1 Tawarikh', id_abbrev: '1Taw', en_name: '1 Chronicles', en_abbrev: '1Ch' },
  { id: '2CH', testament: 'OT', chapters: 36, id_name: '2 Tawarikh', id_abbrev: '2Taw', en_name: '2 Chronicles', en_abbrev: '2Ch' },
  { id: 'EZR', testament: 'OT', chapters: 10, id_name: 'Ezra', id_abbrev: 'Ezr', en_name: 'Ezra', en_abbrev: 'Ezr' },
  { id: 'NEH', testament: 'OT', chapters: 13, id_name: 'Nehemia', id_abbrev: 'Neh', en_name: 'Nehemiah', en_abbrev: 'Neh' },
  { id: 'EST', testament: 'OT', chapters: 10, id_name: 'Ester', id_abbrev: 'Est', en_name: 'Esther', en_abbrev: 'Est' },
  { id: 'JOB', testament: 'OT', chapters: 42, id_name: 'Ayub', id_abbrev: 'Ayb', en_name: 'Job', en_abbrev: 'Job' },
  { id: 'PSA', testament: 'OT', chapters: 150, id_name: 'Mazmur', id_abbrev: 'Mzm', en_name: 'Psalms', en_abbrev: 'Psa' },
  { id: 'PRO', testament: 'OT', chapters: 31, id_name: 'Amsal', id_abbrev: 'Ams', en_name: 'Proverbs', en_abbrev: 'Pro' },
  { id: 'ECC', testament: 'OT', chapters: 12, id_name: 'Pengkhotbah', id_abbrev: 'Pkh', en_name: 'Ecclesiastes', en_abbrev: 'Ecc' },
  { id: 'SNG', testament: 'OT', chapters: 8, id_name: 'Kidung Agung', id_abbrev: 'Kid', en_name: 'Song of Songs', en_abbrev: 'Sng' },
  { id: 'ISA', testament: 'OT', chapters: 66, id_name: 'Yesaya', id_abbrev: 'Yes', en_name: 'Isaiah', en_abbrev: 'Isa' },
  { id: 'JER', testament: 'OT', chapters: 52, id_name: 'Yeremia', id_abbrev: 'Yer', en_name: 'Jeremiah', en_abbrev: 'Jer' },
  { id: 'LAM', testament: 'OT', chapters: 5, id_name: 'Ratapan', id_abbrev: 'Rat', en_name: 'Lamentations', en_abbrev: 'Lam' },
  { id: 'EZK', testament: 'OT', chapters: 48, id_name: 'Yehezkiel', id_abbrev: 'Yeh', en_name: 'Ezekiel', en_abbrev: 'Ezk' },
  { id: 'DAN', testament: 'OT', chapters: 12, id_name: 'Daniel', id_abbrev: 'Dan', en_name: 'Daniel', en_abbrev: 'Dan' },
  { id: 'HOS', testament: 'OT', chapters: 14, id_name: 'Hosea', id_abbrev: 'Hos', en_name: 'Hosea', en_abbrev: 'Hos' },
  { id: 'JOL', testament: 'OT', chapters: 3, id_name: 'Yoel', id_abbrev: 'Yl', en_name: 'Joel', en_abbrev: 'Jol' },
  { id: 'AMO', testament: 'OT', chapters: 9, id_name: 'Amos', id_abbrev: 'Am', en_name: 'Amos', en_abbrev: 'Amo' },
  { id: 'OBA', testament: 'OT', chapters: 1, id_name: 'Obaja', id_abbrev: 'Ob', en_name: 'Obadiah', en_abbrev: 'Oba' },
  { id: 'JON', testament: 'OT', chapters: 4, id_name: 'Yunus', id_abbrev: 'Yun', en_name: 'Jonah', en_abbrev: 'Jon' },
  { id: 'MIC', testament: 'OT', chapters: 7, id_name: 'Mikha', id_abbrev: 'Mi', en_name: 'Micah', en_abbrev: 'Mic' },
  { id: 'NAM', testament: 'OT', chapters: 3, id_name: 'Nahum', id_abbrev: 'Nah', en_name: 'Nahum', en_abbrev: 'Nam' },
  { id: 'HAB', testament: 'OT', chapters: 3, id_name: 'Habakuk', id_abbrev: 'Hab', en_name: 'Habakkuk', en_abbrev: 'Hab' },
  { id: 'ZEP', testament: 'OT', chapters: 3, id_name: 'Zefanya', id_abbrev: 'Zef', en_name: 'Zephaniah', en_abbrev: 'Zep' },
  { id: 'HAG', testament: 'OT', chapters: 2, id_name: 'Hagai', id_abbrev: 'Hag', en_name: 'Haggai', en_abbrev: 'Hag' },
  { id: 'ZEC', testament: 'OT', chapters: 14, id_name: 'Zakharia', id_abbrev: 'Za', en_name: 'Zechariah', en_abbrev: 'Zec' },
  { id: 'MAL', testament: 'OT', chapters: 4, id_name: 'Maleakhi', id_abbrev: 'Mal', en_name: 'Malachi', en_abbrev: 'Mal' },

  { id: 'MAT', testament: 'NT', chapters: 28, id_name: 'Matius', id_abbrev: 'Mat', en_name: 'Matthew', en_abbrev: 'Mat' },
  { id: 'MRK', testament: 'NT', chapters: 16, id_name: 'Markus', id_abbrev: 'Mrk', en_name: 'Mark', en_abbrev: 'Mrk' },
  { id: 'LUK', testament: 'NT', chapters: 24, id_name: 'Lukas', id_abbrev: 'Luk', en_name: 'Luke', en_abbrev: 'Luk' },
  { id: 'JHN', testament: 'NT', chapters: 21, id_name: 'Yohanes', id_abbrev: 'Yoh', en_name: 'John', en_abbrev: 'Jhn' },
  { id: 'ACT', testament: 'NT', chapters: 28, id_name: 'Kisah Para Rasul', id_abbrev: 'Kis', en_name: 'Acts', en_abbrev: 'Act' },
  { id: 'ROM', testament: 'NT', chapters: 16, id_name: 'Roma', id_abbrev: 'Rom', en_name: 'Romans', en_abbrev: 'Rom' },
  { id: '1CO', testament: 'NT', chapters: 16, id_name: '1 Korintus', id_abbrev: '1Kor', en_name: '1 Corinthians', en_abbrev: '1Co' },
  { id: '2CO', testament: 'NT', chapters: 13, id_name: '2 Korintus', id_abbrev: '2Kor', en_name: '2 Corinthians', en_abbrev: '2Co' },
  { id: 'GAL', testament: 'NT', chapters: 6, id_name: 'Galatia', id_abbrev: 'Gal', en_name: 'Galatians', en_abbrev: 'Gal' },
  { id: 'EPH', testament: 'NT', chapters: 6, id_name: 'Efesus', id_abbrev: 'Ef', en_name: 'Ephesians', en_abbrev: 'Eph' },
  { id: 'PHP', testament: 'NT', chapters: 4, id_name: 'Filipi', id_abbrev: 'Flp', en_name: 'Philippians', en_abbrev: 'Php' },
  { id: 'COL', testament: 'NT', chapters: 4, id_name: 'Kolose', id_abbrev: 'Kol', en_name: 'Colossians', en_abbrev: 'Col' },
  { id: '1TH', testament: 'NT', chapters: 5, id_name: '1 Tesalonika', id_abbrev: '1Tes', en_name: '1 Thessalonians', en_abbrev: '1Th' },
  { id: '2TH', testament: 'NT', chapters: 3, id_name: '2 Tesalonika', id_abbrev: '2Tes', en_name: '2 Thessalonians', en_abbrev: '2Th' },
  { id: '1TI', testament: 'NT', chapters: 6, id_name: '1 Timotius', id_abbrev: '1Tim', en_name: '1 Timothy', en_abbrev: '1Ti' },
  { id: '2TI', testament: 'NT', chapters: 4, id_name: '2 Timotius', id_abbrev: '2Tim', en_name: '2 Timothy', en_abbrev: '2Ti' },
  { id: 'TIT', testament: 'NT', chapters: 3, id_name: 'Titus', id_abbrev: 'Tit', en_name: 'Titus', en_abbrev: 'Tit' },
  { id: 'PHM', testament: 'NT', chapters: 1, id_name: 'Filemon', id_abbrev: 'Flm', en_name: 'Philemon', en_abbrev: 'Phm' },
  { id: 'HEB', testament: 'NT', chapters: 13, id_name: 'Ibrani', id_abbrev: 'Ibr', en_name: 'Hebrews', en_abbrev: 'Heb' },
  { id: 'JAS', testament: 'NT', chapters: 5, id_name: 'Yakobus', id_abbrev: 'Yak', en_name: 'James', en_abbrev: 'Jas' },
  { id: '1PE', testament: 'NT', chapters: 5, id_name: '1 Petrus', id_abbrev: '1Ptr', en_name: '1 Peter', en_abbrev: '1Pe' },
  { id: '2PE', testament: 'NT', chapters: 3, id_name: '2 Petrus', id_abbrev: '2Ptr', en_name: '2 Peter', en_abbrev: '2Pe' },
  { id: '1JN', testament: 'NT', chapters: 5, id_name: '1 Yohanes', id_abbrev: '1Yoh', en_name: '1 John', en_abbrev: '1Jn' },
  { id: '2JN', testament: 'NT', chapters: 1, id_name: '2 Yohanes', id_abbrev: '2Yoh', en_name: '2 John', en_abbrev: '2Jn' },
  { id: '3JN', testament: 'NT', chapters: 1, id_name: '3 Yohanes', id_abbrev: '3Yoh', en_name: '3 John', en_abbrev: '3Jn' },
  { id: 'JUD', testament: 'NT', chapters: 1, id_name: 'Yudas', id_abbrev: 'Yud', en_name: 'Jude', en_abbrev: 'Jud' },
  { id: 'REV', testament: 'NT', chapters: 22, id_name: 'Wahyu', id_abbrev: 'Why', en_name: 'Revelation', en_abbrev: 'Rev' },
]

/** Canonical order, so packs are always presented Genesis-to-Revelation. */
const ORDER = new Map(BOOKS.map((b, i) => [b.id, i]))

function localise(meta: BookMeta, language: string): { name: string; abbrev: string } {
  return language.startsWith('id') || language === 'ind'
    ? { name: meta.id_name, abbrev: meta.id_abbrev }
    : { name: meta.en_name, abbrev: meta.en_abbrev }
}

/** The full 66-book canon named for a language. Used by the mock source. */
export function booksFor(language: string): Book[] {
  return BOOKS.map((b) => ({
    id: b.id,
    ...localise(b, language),
    testament: b.testament,
    chapterCount: b.chapters,
  }))
}

/**
 * Names the books an installed pack actually contains.
 *
 * Chapter counts come from the pack, not the canon, so a New Testament-only
 * translation shows only the books it has and never offers a chapter that
 * would come back empty. Unknown book codes (deuterocanon, for instance) are
 * passed through under their raw code rather than dropped, so nothing an
 * installed pack contains becomes silently unreachable.
 */
export function namedBooks(
  language: string,
  present: Array<{ bookId: string; chapterCount: number }>,
): Book[] {
  return present
    .map(({ bookId, chapterCount }) => {
      const meta = BOOKS.find((b) => b.id === bookId)
      if (!meta) {
        return {
          id: bookId,
          name: bookId,
          abbrev: bookId,
          testament: 'OT' as TestamentId,
          chapterCount,
        }
      }
      return { id: bookId, ...localise(meta, language), testament: meta.testament, chapterCount }
    })
    .sort((a, b) => (ORDER.get(a.id) ?? 999) - (ORDER.get(b.id) ?? 999))
}

export function bookNameFor(language: string, bookId: string): string {
  const meta = BOOKS.find((b) => b.id === bookId)
  return meta ? localise(meta, language).name : bookId
}
