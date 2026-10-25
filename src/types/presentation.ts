export type PdfOrientationHandling =
  | 'fit' // Fit whole page in 16:9 with pillarbox
  | 'split' // Smart crop: divide portrait page into 2 landscape slides (Top & Bottom)
  | 'rotate_cw' // Rotate 90 deg clockwise
  | 'rotate_ccw' // Rotate 90 deg counter-clockwise

export interface PdfImportOptions {
  orientationHandling: PdfOrientationHandling
  scale?: number // Default 1.5 or 2.0
}

export interface PresentationSlideItem {
  id: string
  deckId: string
  index: number
  imageUrl: string
  imagePath?: string
  badge?: string // e.g. "Hal 1" or "Hal 1 (Atas)"
  thumbnailUrl?: string
  aspectRatio?: number
}

export interface PresentationDeck {
  id: string
  title: string
  sourceFileName: string
  sourceType: 'pdf' | 'pptx'
  slideCount: number
  slides: PresentationSlideItem[]
  createdAt: string
  orientationHandling?: PdfOrientationHandling
}
