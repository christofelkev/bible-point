import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url'
import type {
  PdfImportOptions,
  PresentationDeck,
  PresentationSlideItem,
} from '../../types/presentation'
import { presentationStore } from './index'

// Configure worker to run fully offline from the bundled Vite asset
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker
}

function canvasToBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Gagal mengekstrak gambar slide dari dokumen PDF'))
        return
      }
      blob
        .arrayBuffer()
        .then((buf) => resolve(new Uint8Array(buf)))
        .catch(reject)
    }, 'image/png')
  })
}

export interface PdfDocumentSummary {
  pageCount: number
  isPortrait: boolean
  firstPageAspect: number
  firstPageThumbnailUrl?: string
}

/** Inspects the first page of a PDF to detect orientation and page count */
export async function inspectPdf(file: File): Promise<PdfDocumentSummary> {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const doc = await loadingTask.promise

  const firstPage = await doc.getPage(1)
  const viewport = firstPage.getViewport({ scale: 1.0 })
  const isPortrait = viewport.height > viewport.width
  const firstPageAspect = viewport.width / viewport.height

  // Render a small preview thumbnail
  const thumbScale = Math.min(260 / viewport.width, 260 / viewport.height)
  const thumbViewport = firstPage.getViewport({ scale: thumbScale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(thumbViewport.width)
  canvas.height = Math.round(thumbViewport.height)
  const ctx = canvas.getContext('2d')

  let firstPageThumbnailUrl: string | undefined
  if (ctx) {
    await firstPage.render({
      canvasContext: ctx,
      viewport: thumbViewport,
      canvas,
    }).promise
    firstPageThumbnailUrl = canvas.toDataURL('image/png')
  }

  return {
    pageCount: doc.numPages,
    isPortrait,
    firstPageAspect,
    firstPageThumbnailUrl,
  }
}

export interface ImportPdfProgressCallback {
  (current: number, total: number, message: string): void
}

/** Imports a PDF file, converting each page into presentation slides according to chosen orientation */
export async function importPdfToDeck(
  file: File,
  options: PdfImportOptions,
  onProgress?: ImportPdfProgressCallback,
): Promise<PresentationDeck> {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const doc = await loadingTask.promise

  const deckId = `deck-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const title = file.name.replace(/\.[^/.]+$/, '')
  const scale = options.scale ?? 2.0
  const slides: PresentationSlideItem[] = []

  let slideIndexCounter = 0

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    onProgress?.(
      pageNum,
      doc.numPages,
      `Memproses halaman ${pageNum} dari ${doc.numPages}...`,
    )

    const page = await doc.getPage(pageNum)
    let rotation = page.rotate

    if (options.orientationHandling === 'rotate_cw') {
      rotation = (rotation + 90) % 360
    } else if (options.orientationHandling === 'rotate_ccw') {
      rotation = (rotation + 270) % 360
    }

    const viewport = page.getViewport({ scale, rotation })
    const isPortrait = viewport.height > viewport.width

    // Render full page onto an offscreen canvas
    const fullCanvas = document.createElement('canvas')
    fullCanvas.width = Math.round(viewport.width)
    fullCanvas.height = Math.round(viewport.height)
    const ctx = fullCanvas.getContext('2d')
    if (!ctx) {
      throw new Error('Gagal menginisialisasi konteks render 2D canvas')
    }

    // Set white background before rendering
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, fullCanvas.width, fullCanvas.height)

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas: fullCanvas,
    }).promise

    if (options.orientationHandling === 'split' && isPortrait) {
      // Split portrait page into 2 landscape slides: Top (A) and Bottom (B)
      const halfHeight = Math.round(fullCanvas.height / 2)

      // Slide A: Top half
      const topCanvas = document.createElement('canvas')
      topCanvas.width = fullCanvas.width
      topCanvas.height = halfHeight
      const topCtx = topCanvas.getContext('2d')
      if (topCtx) {
        topCtx.drawImage(
          fullCanvas,
          0,
          0,
          fullCanvas.width,
          halfHeight,
          0,
          0,
          fullCanvas.width,
          halfHeight,
        )
        const topBytes = await canvasToBytes(topCanvas)
        const { url, path } = await presentationStore.saveSlideImage(
          deckId,
          slideIndexCounter,
          topBytes,
        )
        slides.push({
          id: `${deckId}-s${slideIndexCounter}`,
          deckId,
          index: slideIndexCounter,
          imageUrl: url,
          imagePath: path,
          badge: `Hal ${pageNum} (Atas)`,
        })
        slideIndexCounter++
      }

      // Slide B: Bottom half
      const bottomCanvas = document.createElement('canvas')
      bottomCanvas.width = fullCanvas.width
      bottomCanvas.height = fullCanvas.height - halfHeight
      const bottomCtx = bottomCanvas.getContext('2d')
      if (bottomCtx) {
        bottomCtx.drawImage(
          fullCanvas,
          0,
          halfHeight,
          fullCanvas.width,
          bottomCanvas.height,
          0,
          0,
          fullCanvas.width,
          bottomCanvas.height,
        )
        const bottomBytes = await canvasToBytes(bottomCanvas)
        const { url, path } = await presentationStore.saveSlideImage(
          deckId,
          slideIndexCounter,
          bottomBytes,
        )
        slides.push({
          id: `${deckId}-s${slideIndexCounter}`,
          deckId,
          index: slideIndexCounter,
          imageUrl: url,
          imagePath: path,
          badge: `Hal ${pageNum} (Bawah)`,
        })
        slideIndexCounter++
      }
    } else {
      // Standard 1 slide per page
      const bytes = await canvasToBytes(fullCanvas)
      const { url, path } = await presentationStore.saveSlideImage(
        deckId,
        slideIndexCounter,
        bytes,
      )
      slides.push({
        id: `${deckId}-s${slideIndexCounter}`,
        deckId,
        index: slideIndexCounter,
        imageUrl: url,
        imagePath: path,
        badge: `Hal ${pageNum}`,
      })
      slideIndexCounter++
    }
  }

  const deck: PresentationDeck = {
    id: deckId,
    title,
    sourceFileName: file.name,
    sourceType: 'pdf',
    slideCount: slides.length,
    slides,
    createdAt: new Date().toISOString(),
    orientationHandling: options.orientationHandling,
  }

  return deck
}
