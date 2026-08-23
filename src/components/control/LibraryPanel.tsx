import { useState } from 'react'
import { Check, Download, HardDrive, Loader2, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/controls'
import type { Translation } from '../../types/bible'

/**
 * Bible Manager — translations behave like installable extensions rather than a
 * fixed list baked into the app.
 *
 * The download here is simulated: it walks a progress bar and flips the pack to
 * installed. The real implementation downloads a signed pack over HTTP, verifies
 * its checksum, and imports it into local SQLite; this panel's UI does not change.
 */
export function LibraryPanel() {
  const translations = useAppStore((s) => s.translations)
  const installTranslation = useAppStore((s) => s.installTranslation)
  const uninstallTranslation = useAppStore((s) => s.uninstallTranslation)
  const activeTranslationId = useAppStore((s) => s.activeTranslationId)

  const [progress, setProgress] = useState<Record<string, number>>({})

  const installed = translations.filter((t) => t.installed)
  const available = translations.filter((t) => !t.installed)

  function download(id: string) {
    setProgress((p) => ({ ...p, [id]: 0 }))
    const timer = setInterval(() => {
      setProgress((p) => {
        const next = (p[id] ?? 0) + 6 + Math.floor(((p[id] ?? 0) % 7))
        if (next >= 100) {
          clearInterval(timer)
          installTranslation(id)
          const { [id]: _done, ...rest } = p
          return rest
        }
        return { ...p, [id]: next }
      })
    }, 110)
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Group title={`Terpasang (${installed.length})`}>
        {installed.map((t) => (
          <PackRow
            key={t.id}
            translation={t}
            active={t.id === activeTranslationId}
            action={
              installed.length > 1 ? (
                <Button size="sm" variant="ghost" onClick={() => uninstallTranslation(t.id)} title="Hapus pack">
                  <Trash2 size={11} />
                </Button>
              ) : (
                <span className="text-[9px] text-ink-400 px-1">terakhir</span>
              )
            }
          />
        ))}
      </Group>

      <Group title={`Tersedia (${available.length})`}>
        {available.map((t) => {
          const pct = progress[t.id]
          return (
            <PackRow
              key={t.id}
              translation={t}
              progress={pct}
              action={
                pct == null ? (
                  <Button size="sm" variant="solid" onClick={() => download(t.id)}>
                    <Download size={11} /> Unduh
                  </Button>
                ) : (
                  <span className="flex items-center gap-1.5 text-[10px] text-brand-400 tabular-nums px-1">
                    <Loader2 size={11} className="animate-spin" /> {pct}%
                  </span>
                )
              }
            />
          )
        })}
      </Group>

      <div className="px-4 py-5 flex items-start gap-2 text-[10px] leading-relaxed text-ink-400">
        <HardDrive size={12} className="shrink-0 mt-px" />
        <p>
          Pack yang sudah diunduh tersimpan di komputer, jadi aplikasi tetap jalan
          tanpa internet. Unduhan di demo ini masih simulasi.
        </p>
      </div>
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
  translation, action, active, progress,
}: {
  translation: Translation
  action: React.ReactNode
  active?: boolean
  progress?: number
}) {
  const sizeMb = (translation.sizeBytes / 1_000_000).toFixed(1)
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-lg border px-3 py-2.5 flex items-center gap-3',
        active ? 'bg-brand-500/10 border-brand-500/30' : 'bg-ink-900 border-ink-800',
      )}
    >
      {progress != null && (
        <div
          className="absolute inset-y-0 left-0 bg-brand-500/12 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="relative flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-white truncate">{translation.name}</span>
          <span className="shrink-0 text-[9px] font-semibold text-ink-400 border border-ink-700 rounded px-1">
            {translation.abbrev}
          </span>
          {active && <Check size={11} className="shrink-0 text-brand-400" />}
        </div>
        <div className="text-[10px] text-ink-400 truncate">
          {translation.languageName} · {translation.year} · {sizeMb} MB · {translation.license}
        </div>
      </div>

      <div className="relative shrink-0">{action}</div>
    </div>
  )
}
