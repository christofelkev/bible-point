import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Monitor, MonitorOff, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'

/**
 * Opens and closes the projection window, and — on desktop — chooses which
 * display it lands on.
 *
 * The picker is hidden in the browser build because a web page cannot place a
 * window on a chosen display; there the operator drags it across manually.
 */
export function OutputButton() {
  const outputOpen = useAppStore((s) => s.outputOpen)
  const isDesktop = useAppStore((s) => s.isDesktop)
  const monitors = useAppStore((s) => s.monitors)
  const selectedMonitorId = useAppStore((s) => s.selectedMonitorId)
  const setSelectedMonitor = useAppStore((s) => s.setSelectedMonitor)
  const refreshMonitors = useAppStore((s) => s.refreshMonitors)
  const openOutput = useAppStore((s) => s.openOutput)
  const closeOutput = useAppStore((s) => s.closeOutput)

  const [menuOpen, setMenuOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [menuOpen])

  async function toggle() {
    setBusy(true)
    try {
      if (outputOpen) await closeOutput()
      else await openOutput()
    } finally {
      setBusy(false)
    }
  }

  const selected = monitors.find((m) => m.id === selectedMonitorId)

  return (
    <div ref={wrapRef} className="relative flex items-stretch">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={clsx(
          'h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-medium transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isDesktop ? 'rounded-l-lg' : 'rounded-lg',
          outputOpen
            ? 'bg-ink-800 text-ink-300 border border-ink-700 hover:bg-ink-700 hover:text-white'
            : 'bg-brand-500 text-ink-950 hover:bg-brand-400',
        )}
      >
        {outputOpen ? <MonitorOff size={13} /> : <Monitor size={13} />}
        {outputOpen ? 'Tutup Output' : 'Buka Output'}
      </button>

      {isDesktop && (
        <button
          type="button"
          title={selected ? `Tayang di ${selected.name}` : 'Pilih layar'}
          onClick={() => { setMenuOpen((v) => !v); void refreshMonitors() }}
          className={clsx(
            'h-9 w-7 rounded-r-lg border-l inline-flex items-center justify-center transition-colors',
            outputOpen
              ? 'bg-ink-800 border-ink-700 border-y border-r text-ink-300 hover:bg-ink-700'
              : 'bg-brand-500 border-brand-600 text-ink-950 hover:bg-brand-400',
          )}
        >
          <ChevronDown size={12} />
        </button>
      )}

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-[268px] rounded-lg border border-ink-700 bg-ink-850 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-ink-800">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              Layar tujuan
            </span>
            <button
              type="button"
              title="Muat ulang daftar layar"
              onClick={() => void refreshMonitors()}
              className="h-5 w-5 grid place-items-center rounded text-ink-400 hover:text-white hover:bg-ink-800"
            >
              <RefreshCw size={11} />
            </button>
          </div>

          <ul className="p-1">
            {monitors.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => { setSelectedMonitor(m.id); setMenuOpen(false) }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left hover:bg-ink-800 transition-colors"
                >
                  <Monitor size={13} className="shrink-0 text-ink-400" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs text-white truncate">{m.name}</span>
                    <span className="block text-[10px] text-ink-400">
                      {m.width}×{m.height}
                      {m.isPrimary ? ' · layar utama' : ''}
                    </span>
                  </span>
                  {m.id === selectedMonitorId && <Check size={13} className="shrink-0 text-brand-400" />}
                </button>
              </li>
            ))}
          </ul>

          {monitors.length < 2 && (
            <p className="px-3 py-2 border-t border-ink-800 text-[10px] leading-relaxed text-ink-400">
              Hanya satu layar terdeteksi, jadi output dibuka sebagai jendela biasa
              yang bisa dipindah. Sambungkan proyektor lalu muat ulang daftar untuk
              menayangkan fullscreen.
            </p>
          )}

          {outputOpen && (
            <p className="px-3 py-2 border-t border-ink-800 text-[10px] leading-relaxed text-ink-400">
              Output sedang terbuka. Tutup lalu buka lagi agar pindah ke layar yang dipilih.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
