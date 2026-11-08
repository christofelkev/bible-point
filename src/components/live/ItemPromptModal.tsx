import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  isOpen: boolean
  title: string
  placeholder?: string
  initialValue?: string
  confirmLabel?: string
  onClose: () => void
  onSubmit: (value: string) => void
}

function PromptDialogContent({
  title,
  placeholder = '',
  initialValue = '',
  confirmLabel = 'Simpan',
  onClose,
  onSubmit,
}: Omit<Props, 'isOpen'>) {
  const [value, setValue] = useState(initialValue)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-ink-900 border border-ink-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded text-ink-400 hover:text-white hover:bg-ink-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <input
            type="text"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full h-8 px-3 rounded-lg bg-ink-950 border border-ink-800 text-xs text-white placeholder:text-ink-500 focus:outline-none focus:border-amber-500/60"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-ink-700 hover:bg-ink-800 text-xs text-ink-300 hover:text-white transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none text-xs font-semibold text-ink-950 transition-colors cursor-pointer"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ItemPromptModal(props: Props) {
  if (!props.isOpen) return null
  return <PromptDialogContent {...props} key={props.initialValue ?? 'new'} />
}
