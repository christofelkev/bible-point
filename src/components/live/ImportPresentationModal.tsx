import { useState, useRef } from 'react'
import {
  X,
  Upload,
  FileText,
  Presentation,
  Check,
  AlertCircle,
  Loader2,
  Split,
  Maximize2,
  RotateCw,
} from 'lucide-react'
import clsx from 'clsx'
import type { PdfOrientationHandling, PresentationDeck } from '../../types/presentation'
import { inspectPdf, importPdfToDeck, type PdfDocumentSummary } from '../../services/presentation/pdfImporter'
import { importPptxToDeck } from '../../services/presentation/pptxImporter'
import { isTauri } from '../../services/platform'

interface Props {
  isOpen: boolean
  onClose: () => void
  onImportComplete: (deck: PresentationDeck) => void
}

export function ImportPresentationModal({ isOpen, onClose, onImportComplete }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'pdf' | 'pptx' | null>(null)
  const [pdfSummary, setPdfSummary] = useState<PdfDocumentSummary | null>(null)
  const [orientationMode, setOrientationMode] = useState<PdfOrientationHandling>('split')
  const [loading, setLoading] = useState(false)
  const [progressMsg, setProgressMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMsg(null)
    const ext = file.name.split('.').pop()?.toLowerCase()

    if (ext === 'pdf') {
      setSelectedFile(file)
      setFileType('pdf')
      setLoading(true)
      setProgressMsg('Menganalisis orientasi dokumen PDF...')
      try {
        const summary = await inspectPdf(file)
        setPdfSummary(summary)
        // If portrait, default to 'split' (Top/Bottom 2 slides); if landscape, default to 'fit'
        setOrientationMode(summary.isPortrait ? 'split' : 'fit')
      } catch (err) {
        console.error(err)
        setErrorMsg('Gagal membaca dokumen PDF. Pastikan berkas tidak terenkripsi kata sandi.')
        setSelectedFile(null)
        setFileType(null)
      } finally {
        setLoading(false)
      }
    } else if (ext === 'pptx' || ext === 'ppt') {
      setSelectedFile(file)
      setFileType('pptx')
      setPdfSummary(null)
    } else {
      setErrorMsg('Format berkas tidak didukung. Harap pilih berkas .pdf atau .pptx.')
    }
  }

  const handleProcessImport = async () => {
    if (!selectedFile || !fileType) return

    setLoading(true)
    setErrorMsg(null)

    try {
      if (fileType === 'pdf') {
        const deck = await importPdfToDeck(
          selectedFile,
          { orientationHandling: orientationMode, scale: 2.0 },
          (_curr, _total, msg) => setProgressMsg(msg),
        )
        onImportComplete(deck)
        handleClose()
      } else if (fileType === 'pptx') {
        if (!isTauri()) {
          throw new Error(
            'Konversi berkas PPTX langsung hanya didukung di versi Desktop Windows dengan Microsoft Office. ' +
              'Silakan ekspor presentasi ke format PDF terlebih dahulu, lalu impor berkas PDF-nya.',
          )
        }

        // On Tauri desktop, we pass file name or path
        const filePath = (selectedFile as unknown as { path?: string }).path ?? selectedFile.name
        const deck = await importPptxToDeck(filePath, selectedFile.name, (msg) =>
          setProgressMsg(msg),
        )
        onImportComplete(deck)
        handleClose()
      }
    } catch (err: unknown) {
      console.error(err)
      const message =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memproses presentasi. Silakan coba lagi.'
      setErrorMsg(message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setFileType(null)
    setPdfSummary(null)
    setErrorMsg(null)
    setProgressMsg('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-ink-900 border border-ink-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-white animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-ink-800 bg-ink-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Presentation size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Import Presentasi (PDF / PPTX)</h2>
              <p className="text-[11px] text-ink-400">
                Ekstrak slide khotbah & presentasi ke proyektor 16:9
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1 rounded text-ink-400 hover:text-white hover:bg-ink-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!selectedFile ? (
            /* Dropzone / File Picker */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-ink-700 hover:border-amber-500/60 hover:bg-ink-800/40 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition text-center group"
            >
              <div className="w-12 h-12 rounded-full bg-ink-800 group-hover:bg-amber-500/20 group-hover:text-amber-400 flex items-center justify-center text-ink-400 transition">
                <Upload size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-200">
                  Pilih atau seret berkas presentasi ke sini
                </p>
                <p className="text-xs text-ink-400 mt-1">
                  Mendukung berkas <strong className="text-ink-300">PDF (.pdf)</strong> dan{' '}
                  <strong className="text-ink-300">PowerPoint (.pptx)</strong>
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.pptx,.ppt"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            /* Selected File Summary & Options */
            <div className="flex flex-col gap-4">
              <div className="p-3.5 rounded-lg bg-ink-800/60 border border-ink-700 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded bg-ink-700/50 text-amber-400 shrink-0">
                    {fileType === 'pdf' ? <FileText size={20} /> : <Presentation size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink-100 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-ink-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      {pdfSummary && ` · ${pdfSummary.pageCount} Halaman`}
                    </p>
                  </div>
                </div>
                {!loading && (
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setPdfSummary(null)
                      setFileType(null)
                    }}
                    className="text-xs text-ink-400 hover:text-rose-400 hover:underline px-2 py-1"
                  >
                    Ganti
                  </button>
                )}
              </div>

              {/* PDF Specific Orientation Config */}
              {fileType === 'pdf' && pdfSummary && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink-200">
                      Opsi Tampilan Layar 16:9
                    </span>
                    <span
                      className={clsx(
                        'text-[10px] px-2 py-0.5 rounded font-medium',
                        pdfSummary.isPortrait
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
                      )}
                    >
                      {pdfSummary.isPortrait ? 'Orientasi Portrait (A4 / Tinggi)' : 'Orientasi Landscape'}
                    </span>
                  </div>

                  {pdfSummary.isPortrait && (
                    <div className="grid grid-cols-1 gap-2">
                      {/* Opsi 1: Split Top/Bottom (Recommended) */}
                      <button
                        type="button"
                        onClick={() => setOrientationMode('split')}
                        className={clsx(
                          'p-3 rounded-lg border text-left transition flex items-start gap-3',
                          orientationMode === 'split'
                            ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                            : 'bg-ink-800/40 border-ink-700/80 hover:bg-ink-800 hover:border-ink-600',
                        )}
                      >
                        <div className="p-2 rounded bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                          <Split size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              Bagi 2 Slide (Atas & Bawah)
                            </span>
                            <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">
                              ⭐ Direkomendasikan
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-300 mt-1 leading-snug">
                            1 halaman A4 dibagi menjadi 2 slide landscape 16:9. Teks khotbah otomatis
                            tampil <strong>2x lebih besar</strong> dan nyaman dibaca jemaat dari belakang.
                          </p>
                        </div>
                        {orientationMode === 'split' && (
                          <Check size={16} className="text-amber-400 shrink-0 mt-1" />
                        )}
                      </button>

                      {/* Opsi 2: Fit / Pillarbox */}
                      <button
                        type="button"
                        onClick={() => setOrientationMode('fit')}
                        className={clsx(
                          'p-3 rounded-lg border text-left transition flex items-start gap-3',
                          orientationMode === 'fit'
                            ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                            : 'bg-ink-800/40 border-ink-700/80 hover:bg-ink-800 hover:border-ink-600',
                        )}
                      >
                        <div className="p-2 rounded bg-ink-700 text-ink-300 shrink-0 mt-0.5">
                          <Maximize2 size={18} />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-white">Fit Halaman Utuh (Pillarbox)</span>
                          <p className="text-[11px] text-ink-300 mt-1 leading-snug">
                            Halaman penuh di tengah layar proyektor, sisi kiri & kanan berlatar tema gelap.
                            Cocok untuk poster pengumuman atau warta utuh.
                          </p>
                        </div>
                        {orientationMode === 'fit' && (
                          <Check size={16} className="text-amber-400 shrink-0 mt-1" />
                        )}
                      </button>

                      {/* Opsi 3: Rotate 90 CW */}
                      <button
                        type="button"
                        onClick={() => setOrientationMode('rotate_cw')}
                        className={clsx(
                          'p-3 rounded-lg border text-left transition flex items-start gap-3',
                          orientationMode === 'rotate_cw'
                            ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                            : 'bg-ink-800/40 border-ink-700/80 hover:bg-ink-800 hover:border-ink-600',
                        )}
                      >
                        <div className="p-2 rounded bg-ink-700 text-ink-300 shrink-0 mt-0.5">
                          <RotateCw size={18} />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-white">Putar 90° Searah Jarum Jam</span>
                          <p className="text-[11px] text-ink-300 mt-1 leading-snug">
                            Untuk dokumen lanskap yang sengaja disimpan dalam orientasi portrait.
                          </p>
                        </div>
                        {orientationMode === 'rotate_cw' && (
                          <Check size={16} className="text-amber-400 shrink-0 mt-1" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PPTX Specific Notice */}
              {fileType === 'pptx' && (
                <div className="p-3.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex flex-col gap-1.5 leading-relaxed">
                  <span className="font-semibold text-blue-100 flex items-center gap-1.5">
                    <Presentation size={15} /> Integrasi Presentasi PowerPoint
                  </span>
                  <span>
                    Aplikasi akan mengekspor setiap slide PowerPoint menjadi gambar beresolusi tinggi (Full HD).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Progress Indicator */}
          {loading && (
            <div className="p-4 rounded-lg bg-ink-950/70 border border-ink-800 flex items-center gap-3">
              <Loader2 size={18} className="animate-spin text-amber-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-ink-200">Sedang mengekstrak slide...</p>
                <p className="text-[11px] text-ink-400 truncate mt-0.5">{progressMsg}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-ink-800 bg-ink-950 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-medium text-ink-300 hover:text-white hover:bg-ink-800 transition"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!selectedFile || loading}
            onClick={handleProcessImport}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-ink-950 transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Import Slide ke Panggung</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
