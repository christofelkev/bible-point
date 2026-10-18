import type { Song } from '../types/song'

export const DEFAULT_SONGS: Song[] = [
  {
    id: 'song-1',
    title: 'Kebaikan Allah (Goodness of God)',
    artist: 'Bethel Music',
    key: 'G',
    tempo: 70,
    arrangement: 'V1 → C → V2 → C → B → C → Tag',
    rawLyrics: `[Verse 1]
Ku mengasihi-Mu
Tak pernah Kau gagal
Setiap hariku dalam tangan-Mu

[Chorus]
Seumur hidupku Kau setia
Seumur hidupku Kau sangat baik
Dengan hembusan nafas yang ada
Ku akan bernyanyi akan kebaikan Allah

[Verse 2]
Ku suka suara-Mu
Membimbing langkahku
Dalam kegelapan Kau dekat denganku

[Bridge]
Kebaikan-Mu selalu mengejarku
Selalu mengejarku
Kuserahkan hidupku pada-Mu

[Tag]
Ku bernyanyi akan kebaikan Allah
Kebaikan Allah`,
    slides: [
      {
        kind: 'song',
        badge: 'Verse 1',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '1/7',
        lines: [
          'Ku mengasihi-Mu',
          'Tak pernah Kau gagal',
          'Setiap hariku dalam tangan-Mu',
        ],
      },
      {
        kind: 'song',
        badge: 'Chorus',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '2/7',
        lines: [
          'Seumur hidupku Kau setia',
          'Seumur hidupku Kau sangat baik',
          'Dengan hembusan nafas yang ada',
          'Ku akan bernyanyi akan kebaikan Allah',
        ],
      },
      {
        kind: 'song',
        badge: 'Verse 2',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '3/7',
        lines: [
          'Ku suka suara-Mu',
          'Membimbing langkahku',
          'Dalam kegelapan Kau dekat denganku',
        ],
      },
      {
        kind: 'song',
        badge: 'Chorus',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '4/7',
        lines: [
          'Seumur hidupku Kau setia',
          'Seumur hidupku Kau sangat baik',
          'Dengan hembusan nafas yang ada',
          'Ku akan bernyanyi akan kebaikan Allah',
        ],
      },
      {
        kind: 'song',
        badge: 'Bridge',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '5/7',
        lines: [
          'Kebaikan-Mu selalu mengejarku',
          'Selalu mengejarku',
          'Kuserahkan hidupku pada-Mu',
        ],
      },
      {
        kind: 'song',
        badge: 'Chorus',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '6/7',
        lines: [
          'Seumur hidupku Kau setia',
          'Seumur hidupku Kau sangat baik',
          'Dengan hembusan nafas yang ada',
          'Ku akan bernyanyi akan kebaikan Allah',
        ],
      },
      {
        kind: 'song',
        badge: 'Tag',
        reference: 'Kebaikan Allah — Bethel Music',
        secondaryMeta: 'Key: G',
        slideProgress: '7/7',
        lines: [
          'Ku bernyanyi akan kebaikan Allah',
          'Kebaikan Allah',
        ],
      },
    ],
  },
  {
    id: 'song-2',
    title: 'Kemenangan Terjadi Di Sini',
    artist: 'NDC Worship',
    key: 'C',
    tempo: 74,
    arrangement: 'V1 → C → B → C',
    rawLyrics: `[Verse 1]
Kumenyembah dalam kudus hadirat-Mu
Hampiri tahta kasih karunia-Mu Bapa
Kekuatanku hanya di dalam hadirat-Mu

[Chorus]
Ada mukjizat dalam hadirat-Mu
Ada pemulihan di hadirat-Mu
Kemenangan terjadi di sini

[Bridge]
Segala perkara dapat kutanggung
Di dalam Dia yang memberi kekuatan
Tuhan Yesus sumber kemenanganku`,
    slides: [
      {
        kind: 'song',
        badge: 'Verse 1',
        reference: 'Kemenangan Terjadi Di Sini — NDC Worship',
        secondaryMeta: 'Key: C',
        slideProgress: '1/4',
        lines: [
          'Kumenyembah dalam kudus hadirat-Mu',
          'Hampiri tahta kasih karunia-Mu Bapa',
          'Kekuatanku hanya di dalam hadirat-Mu',
        ],
      },
      {
        kind: 'song',
        badge: 'Chorus',
        reference: 'Kemenangan Terjadi Di Sini — NDC Worship',
        secondaryMeta: 'Key: C',
        slideProgress: '2/4',
        lines: [
          'Ada mukjizat dalam hadirat-Mu',
          'Ada pemulihan di hadirat-Mu',
          'Kemenangan terjadi di sini',
        ],
      },
      {
        kind: 'song',
        badge: 'Bridge',
        reference: 'Kemenangan Terjadi Di Sini — NDC Worship',
        secondaryMeta: 'Key: C',
        slideProgress: '3/4',
        lines: [
          'Segala perkara dapat kutanggung',
          'Di dalam Dia yang memberi kekuatan',
          'Tuhan Yesus sumber kemenanganku',
        ],
      },
      {
        kind: 'song',
        badge: 'Chorus',
        reference: 'Kemenangan Terjadi Di Sini — NDC Worship',
        secondaryMeta: 'Key: C',
        slideProgress: '4/4',
        lines: [
          'Ada mukjizat dalam hadirat-Mu',
          'Ada pemulihan di hadirat-Mu',
          'Kemenangan terjadi di sini',
        ],
      },
    ],
  },
]
