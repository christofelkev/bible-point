import { useMemo, useState } from 'react'
import { AlertCircle, Check, Download, FileUp, HardDrive, Search, Trash2, X } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/controls'
import type { Translation } from '../../types/bible'
import type { InstallPhase } from '../../services/bible'
import { SideloadDialog } from './SideloadDialog'

/**
 * The catalog can run to well over a thousand entries. Rendering all of them
 * would cost more than it helps, so the list is capped and the operator is told
 * to narrow it — a real count beats a silently truncated list.
 */
const MAX_AVAILABLE_ROWS = 60

const PHASE_LABEL: Record<InstallPhase, string> = {
  downloading: 'Mengunduh',
  extracting: 'Membuka arsip',
  importing: 'Memasukkan ayat',
  indexing: 'Membuat indeks',
  done: 'Selesai',
  error: 'Gagal',
}

/**
 * Bible Manager — translations behave like installable extensions rather than a
 * fixed list baked into the app.
 *
 * Everything offered here is marked redistributable by its publisher; the
 * copyright line on each row is the publisher's own and is shown, not summarised.
 */
export function LibraryPanel() {
  const translations = useAppStore((s) => s.translations)
  const activeTranslationId = useAppStore((s) => s.activeTranslationId)
  const installProgress = useAppStore((s) => s.installProgress)
  const installError = useAppStore((s) => s.installError)
  const installTranslation = useAppStore((s) => s.installTranslation)
  const uninstallTranslation = useAppStore((s) => s.uninstallTranslation)
  const dismissInstallError = useAppStore((s) => s.dismissInstallError)

  const isDesktop = useAppStore((s) => s.isDesktop)
  const [query, setQuery] = useState('')
  const [sideloadOpen, setSideloadOpen] = useState(false)

  const { installed, available, totalAvailable } = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matches = (t: Translation) =>
      needle === '' ||
      t.name.toLowerCase().includes(needle) ||
      t.abbrev.toLowerCase().includes(needle) ||
      t.languageName.toLowerCase().includes(needle) ||
      t.language.toLowerCase().includes(needle)

    const installed = translations.filter((t) => t.installed && matches(t))
    const allAvailable = translations.filter((t) => !t.installed && matches(t))
    return {
      installed,
      available: allAvailable.slice(0, MAX_AVAILABLE_ROWS),
      totalAvailable: allAvailable.length,
    }
  }, [translations, query])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="shrink-0 p-2 border-b border-ink-800">
        <div className="relative h-8 flex items-center rounded-lg border border-ink-800 bg-ink-950 focus-within:border-ink-600">
          <Search size={13} className="absolute left-2.5 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari terjemahan atau bahasa…"
            className="w-full h-full bg-transparent pl-8 pr-7 text-xs text-white placeholder:text-ink-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 text-ink-400 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Group title={`Terpasang (${installed.length})`}>
          {installed.length === 0 ? (
            <p className="px-1 py-2 text-[11px] leading-relaxed text-ink-400">
              Belum ada terjemahan terpasang. Pilih satu dari daftar di bawah,
              lalu tekan Unduh. Setelah terpasang, aplikasi bekerja tanpa internet.
            </p>
          ) : (
            installed.map((t) => (
              <PackRow
                key={t.id}
                translation={t}
                active={t.id === activeTranslationId}
                error={installError[t.id]}
                onDismissError={() => dismissInstallError(t.id)}
                action={
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => uninstallTranslation(t.id)}
                    title="Hapus terjemahan ini"
                  >
                    <Trash2 size={11} />
                  </Button>
                }
              />
            ))
          )}
        </Group>

        <Group title={`Tersedia (${totalAvailable})`}>
          {available.map((t) => {
            const progress = installProgress[t.id]
            return (
              <PackRow
                key={t.id}
                translation={t}
                progress={progress?.percent}
                phase={progress?.phase}
                error={installError[t.id]}
                onDismissError={() => dismissInstallError(t.id)}
                action={
                  progress ? (
                    <span className="px-1 text-[10px] tabular-nums text-brand-400 whitespace-nowrap">
                      {PHASE_LABEL[progress.phase]} {progress.percent}%
                    </span>
                  ) : (
                    <Button size="sm" variant="solid" onClick={() => installTranslation(t.id)}>
                      <Download size={11} /> Unduh
                    </Button>
                  )
                }
              />
            )
          })}

          {totalAvailable > available.length && (
            <p className="px-1 py-2 text-[11px] leading-relaxed text-ink-400">
              Menampilkan {available.length} dari {totalAvailable} terjemahan.
              Ketik di kotak pencarian untuk mempersempit daftar.
            </p>
          )}

          {totalAvailable === 0 && query && (
            <p className="px-1 py-2 text-[11px] text-ink-400">
              Tidak ada terjemahan yang cocok dengan "{query}".
            </p>
          )}
        </Group>

        <div className="px-4 py-5 space-y-3">
          <div className="flex items-start gap-2 text-[10px] leading-relaxed text-ink-400">
            <HardDrive size={12} className="shrink-0 mt-px" />
            <p>
              Katalog diambil dari eBible.org dan hanya memuat terjemahan yang
              ditandai boleh didistribusikan ulang oleh penerbitnya. Terjemahan
              berhak cipta seperti TB tidak ada di sini — pasang sendiri dari
              salinanmu lewat tombol di bawah.
            </p>
          </div>

          {isDesktop && (
            <Button variant="solid" size="sm" className="w-full" onClick={() => setSideloadOpen(true)}>
              <FileUp size={12} /> Pasang dari berkas
            </Button>
          )}
        </div>
      </div>

      {sideloadOpen && <SideloadDialog onClose={() => setSideloadOpen(false)} />}
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="sticky top-0 z-10 bg-ink-900/95 backdrop-blur px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400 border-b border-ink-850">
        {title}
      </div>
      <div className="p-2 space-y-1">{children}</div>
    </section>
  )
}

function PackRow({
  translation, action, active, progress, phase, error, onDismissError,
}: {
  translation: Translation
  action: React.ReactNode
  active?: boolean
  progress?: number
  phase?: InstallPhase
  error?: string
  onDismissError: () => void
}) {
  const verses = translation.verseCount.toLocaleString('id-ID')
  const scope =
    translation.hasOldTestament && translation.hasNewTestament ? 'PL+PB'
    : translation.hasNewTestament ? 'PB saja'
    : 'PL saja'

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-lg border',
        active ? 'bg-brand-500/10 border-brand-500/30' : 'bg-ink-900 border-ink-800',
      )}
    >
      {progress != null && phase !== 'done' && (
        <div
          className="absolute inset-y-0 left-0 bg-brand-500/12 transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="relative px-3 py-2.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-white truncate">{translation.name}</span>
            <span className="shrink-0 text-[9px] font-semibold text-ink-400 border border-ink-700 rounded px-1">
              {translation.abbrev}
            </span>
            {active && <Check size={11} className="shrink-0 text-brand-400" />}
          </div>
          <div className="text-[10px] text-ink-400 truncate">
            {translation.languageName}
            {translation.year ? ` · ${translation.year}` : ''}
            {' · '}{verses} ayat · {scope}
          </div>
          <div className="text-[10px] text-ink-400/70 truncate" title={translation.license}>
            {translation.license}
          </div>
        </div>

        <div className="relative shrink-0">{action}</div>
      </div>

      {error && (
        <div className="relative flex items-start gap-1.5 px-3 pb-2.5 text-[10px] leading-relaxed text-red-300">
          <AlertCircle size={11} className="shrink-0 mt-px" />
          <span className="flex-1">{error}</span>
          <button onClick={onDismissError} className="shrink-0 text-red-300/70 hover:text-red-200">
            <X size={11} />
          </button>
        </div>
      )}
    </div>
  )
}
