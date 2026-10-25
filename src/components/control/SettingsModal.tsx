import { useState } from 'react'
import { X, Settings, RotateCcw, Check } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { DEFAULT_SONG_GROUPS, DEFAULT_SECTION_HOTKEYS } from '../../data/songHotkeys'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: Props) {
  const sectionHotkeys = useAppStore((s) => s.sectionHotkeys)
  const setSectionHotkeys = useAppStore((s) => s.setSectionHotkeys)

  const [localHotkeys, setLocalHotkeys] = useState<Record<string, string>>({
    ...DEFAULT_SECTION_HOTKEYS,
    ...sectionHotkeys,
  })

  if (!isOpen) return null

  const handleKeyChange = (groupName: string, rawVal: string) => {
    const cleaned = rawVal.trim().slice(-1).toUpperCase()
    setLocalHotkeys((prev) => ({
      ...prev,
      [groupName]: cleaned,
    }))
  }

  const handleReset = () => {
    setLocalHotkeys({ ...DEFAULT_SECTION_HOTKEYS })
  }

  const handleSave = () => {
    setSectionHotkeys(localHotkeys)
    onClose()
  }

  const dotColors: Record<string, string> = {
    blue: 'bg-blue-400',
    amber: 'bg-amber-400',
    purple: 'bg-purple-400',
    yellow: 'bg-yellow-400',
    emerald: 'bg-emerald-400',
    slate: 'bg-slate-400',
    rose: 'bg-rose-400',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-ink-950 border border-ink-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-ink-100">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-ink-800 flex items-center justify-between bg-ink-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-ink-800 border border-ink-700/60 flex items-center justify-center text-ink-300">
              <Settings size={15} />
            </div>
            <h2 className="text-sm font-bold text-white">Pengaturan</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
          <div>
            <span className="text-xs font-bold text-ink-300 uppercase tracking-wider block mb-3">
              Hotkey Seksi Lagu
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {DEFAULT_SONG_GROUPS.map((group) => {
                const key = localHotkeys[group.name] ?? ''

                return (
                  <div
                    key={group.name}
                    className="p-2.5 rounded-xl bg-ink-900/60 border border-ink-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${dotColors[group.color] ?? 'bg-ink-500'}`} />
                      <span className="text-xs font-medium text-ink-200">{group.name}</span>
                    </div>

                    <input
                      type="text"
                      maxLength={1}
                      value={key}
                      onChange={(e) => handleKeyChange(group.name, e.target.value)}
                      placeholder="—"
                      className="w-8 h-8 rounded-lg bg-ink-950 border border-ink-700 text-center font-mono font-bold text-xs text-amber-400 uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-ink-800 flex items-center justify-between bg-ink-900/80">
          <button
            onClick={handleReset}
            className="px-3 h-8 rounded-lg bg-ink-800 hover:bg-ink-700 text-xs font-medium text-ink-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 h-8 rounded-lg bg-ink-800 hover:bg-ink-700 text-xs font-medium text-ink-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-4 h-8 rounded-lg bg-amber-400 hover:bg-amber-300 text-ink-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Check size={14} />
              <span>Simpan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
