import { useRef, useState } from 'react'
import { FileUp, Loader2, X } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/controls'

interface Props {
  onClose: () => void
}

/**
 * Installs a translation from a file the operator already has.
 *
 * This is the legitimate route for texts the catalog cannot carry: a church's
 * own licensed copy, or a translation with no online distribution at all. The
 * app never goes looking for these — it only imports what it is handed.
 *
 * A bare verse-per-line file carries no metadata, so the operator supplies the
 * name, abbreviation and language themselves.
 */
export function SideloadDialog({ onClose }: Props) {
  const sideloadTranslation = useAppStore((s) => s.sideloadTranslation)

  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [abbrev, setAbbrev] = useState('')
  const [languageName, setLanguageName] = useState('Indonesian')
  const [language, setLanguage] = useState('ind')
  const [license, setLicense] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onPick(picked: File | undefined) {
    if (!picked) return
    setFile(picked)
    setError(null)
    // A sensible starting point the operator can correct, rather than an empty
    // form after they have already told us the file name.
    if (!name) setName(picked.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '))
  }

  async function submit() {
    if (!file || !name.trim() || !abbrev.trim()) return
    setBusy(true)
    setError(null)
    try {
      await sideloadTranslation(file, {
        id: slugify(name),
        name: name.trim(),
        abbrev: abbrev.trim().toUpperCase(),
        language: language.trim() || 'ind',
        languageName: languageName.trim() || 'Indonesian',
        license: license.trim() || 'Salinan pribadi — tidak untuk didistribusikan ulang',
      })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  const ready = Boolean(file && name.trim() && abbrev.trim()) && !busy

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6" onClick={onClose}>
      <div
        className="w-full max-w-[460px] rounded-xl border border-ink-700 bg-ink-850 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 h-11 border-b border-ink-800">
          <h2 className="text-[13px] font-semibold">Pasang dari berkas</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-white">
            <X size={15} />
          </button>
        </header>

        <div className="p-4 space-y-3 max-h-[62vh] overflow-y-auto">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-lg border border-dashed border-ink-600 hover:border-brand-500 px-4 py-5 text-center transition-colors"
          >
            <FileUp size={18} className="mx-auto mb-2 text-ink-400" />
            <div className="text-xs text-white truncate">
              {file ? file.name : 'Pilih berkas .txt atau .zip'}
            </div>
            <div className="mt-1 text-[10px] text-ink-400">
              {file
                ? `${(file.size / 1_048_576).toFixed(1)} MB`
                : 'Format verse-per-line: satu baris per ayat'}
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.zip"
            className="hidden"
            onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = '' }}
          />

          <pre className="rounded-lg bg-ink-950 border border-ink-800 p-2.5 text-[10px] leading-relaxed text-ink-400 overflow-x-auto">
{`GEN 1:1 Pada mulanya Allah menciptakan langit dan bumi.
JHN 3:16 Karena begitu besar kasih Allah akan dunia ini...`}
          </pre>

          <TextField label="Nama" value={name} onChange={setName} placeholder="Terjemahan Baru" />
          <TextField label="Singkatan" value={abbrev} onChange={setAbbrev} placeholder="TB" />
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Bahasa" value={languageName} onChange={setLanguageName} placeholder="Indonesian" />
            <TextField label="Kode" value={language} onChange={setLanguage} placeholder="ind" />
          </div>
          <TextField
            label="Hak cipta"
            value={license}
            onChange={setLicense}
            placeholder="© Lembaga Alkitab Indonesia"
          />

          <p className="text-[10px] leading-relaxed text-ink-400">
            Terjemahan yang dipasang lewat jalur ini hanya tersimpan di komputer
            ini. Punya salinan pribadi tidak berarti boleh menyebarkannya — kalau
            aplikasi ini nanti dibagikan ke gereja lain, pack-nya jangan ikut.
          </p>

          {error && (
            <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] leading-relaxed text-red-300">
              {error}
            </p>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-4 h-12 border-t border-ink-800">
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button variant="brand" onClick={submit} disabled={!ready}>
            {busy ? <Loader2 size={13} className="animate-spin" /> : <FileUp size={13} />}
            {busy ? 'Memasang…' : 'Pasang'}
          </Button>
        </footer>
      </div>
    </div>
  )
}

function TextField({
  label, value, onChange, placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="block mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-400">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-8 px-2.5 rounded-lg bg-ink-950 border border-ink-800 text-xs text-white
                   placeholder:text-ink-600 focus:outline-none focus:border-ink-600"
      />
    </label>
  )
}

/** Turns a display name into an id safe to use as a database key. */
function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'pack'
  )
}
