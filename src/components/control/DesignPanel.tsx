import { useRef } from 'react'
import {
  AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowUpToLine,
  FoldVertical, Save, Upload, Palette, Type as TypeIcon,
} from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '../../store/useAppStore'
import { FONT_OPTIONS, GRADIENT_SWATCHES } from '../../data/presets'
import { backgroundCss } from '../stage/StageBackground'
import {
  Button, ColorField, Field, Section, Segmented, Select, Slider, Toggle,
} from '../ui/controls'
import type { Background } from '../../types/theme'

/** Everything that shapes the look of the output, grouped by what it affects. */
export function DesignPanel() {
  const theme = useAppStore((s) => s.theme)
  const themes = useAppStore((s) => s.themes)
  const activeThemeId = useAppStore((s) => s.activeThemeId)
  const applyTheme = useAppStore((s) => s.applyTheme)
  const saveThemeAsPreset = useAppStore((s) => s.saveThemeAsPreset)
  const setBackground = useAppStore((s) => s.setBackground)
  const patchTypography = useAppStore((s) => s.patchTypography)
  const patchLayout = useAppStore((s) => s.patchLayout)
  const patchOverlay = useAppStore((s) => s.patchOverlay)
  const patchTransition = useAppStore((s) => s.patchTransition)

  const fileRef = useRef<HTMLInputElement>(null)
  const { background, overlay, typography: type, layout, transition } = theme

  /**
   * Custom backgrounds are held as object URLs during frontend development.
   * Under Tauri the file is copied into the app's media folder and the theme
   * stores that path instead, so themes survive a restart.
   */
  function onPickImage(file: File | undefined) {
    if (!file) return
    const src = URL.createObjectURL(file)
    setBackground({ kind: 'image', src, fit: 'cover', label: file.name })
  }

  function switchBackgroundKind(kind: Background['kind']) {
    if (kind === background.kind) return
    if (kind === 'solid') setBackground({ kind: 'solid', color: '#0b1224' })
    else if (kind === 'gradient') {
      setBackground({
        kind: 'gradient', shape: 'linear', angle: 160,
        stops: [{ color: '#0b1224', at: 0 }, { color: '#1c2b52', at: 100 }],
      })
    } else fileRef.current?.click()
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <Section
        title="Preset"
        action={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const name = window.prompt('Nama preset baru', `${theme.name} Copy`)
              if (name?.trim()) saveThemeAsPreset(name.trim())
            }}
          >
            <Save size={11} /> Simpan
          </Button>
        }
      >
        <div className="grid grid-cols-3 gap-1.5">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTheme(t.id)}
              title={t.name}
              className={clsx(
                'group relative h-[52px] rounded-lg overflow-hidden border-2 transition-colors',
                t.id === activeThemeId ? 'border-brand-500' : 'border-transparent hover:border-ink-600',
              )}
            >
              <div className="absolute inset-0" style={{ background: backgroundCss(t.background) }} />
              <span
                className="absolute inset-0 grid place-items-center text-[13px] font-semibold"
                style={{ color: t.typography.color, textShadow: '0 1px 4px rgba(0,0,0,.5)' }}
              >
                Aa
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-black/55 text-[8px] text-white/85 py-px truncate px-1">
                {t.name}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Background">
        <Field label="Jenis">
          <Segmented
            value={background.kind}
            onChange={switchBackgroundKind}
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'gradient', label: 'Gradien' },
              { value: 'image', label: 'Gambar' },
            ]}
          />
        </Field>

        {background.kind === 'solid' && (
          <Field label="Warna">
            <ColorField value={background.color} onChange={(color) => setBackground({ kind: 'solid', color })} />
          </Field>
        )}

        {background.kind === 'gradient' && (
          <>
            <div className="grid grid-cols-4 gap-1.5">
              {GRADIENT_SWATCHES.map((g) => (
                <button
                  key={g.name}
                  title={g.name}
                  onClick={() => setBackground({ kind: 'gradient', shape: 'linear', angle: g.angle, stops: g.stops })}
                  className="h-8 rounded-md border border-ink-800 hover:border-ink-600 transition-colors"
                  style={{ background: `linear-gradient(${g.angle}deg, ${g.stops.map((s) => `${s.color} ${s.at}%`).join(', ')})` }}
                />
              ))}
            </div>
            <Field label="Bentuk">
              <Segmented
                value={background.shape}
                onChange={(shape) => setBackground({ ...background, shape })}
                options={[{ value: 'linear', label: 'Linear' }, { value: 'radial', label: 'Radial' }]}
              />
            </Field>
            {background.shape === 'linear' && (
              <Field label="Sudut">
                <Slider
                  value={background.angle} min={0} max={360} suffix="°"
                  onChange={(angle) => setBackground({ ...background, angle })}
                />
              </Field>
            )}
            {background.stops.map((stop, i) => (
              <Field key={i} label={i === 0 ? 'Warna awal' : i === background.stops.length - 1 ? 'Warna akhir' : `Warna ${i + 1}`}>
                <ColorField
                  value={stop.color}
                  onChange={(color) => {
                    const stops = background.stops.map((s, j) => (j === i ? { ...s, color } : s))
                    setBackground({ ...background, stops })
                  }}
                />
              </Field>
            ))}
          </>
        )}

        {background.kind === 'image' && (
          <>
            <div className="relative h-24 rounded-lg overflow-hidden border border-ink-800">
              <div className="absolute inset-0" style={{ background: backgroundCss(background) }} />
              <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[10px] text-white/80 px-2 py-1 truncate">
                {background.label ?? 'Gambar kustom'}
              </span>
            </div>
            <Field label="Isi bingkai">
              <Segmented
                value={background.fit}
                onChange={(fit) => setBackground({ ...background, fit })}
                options={[{ value: 'cover', label: 'Penuhi' }, { value: 'contain', label: 'Muat' }]}
              />
            </Field>
          </>
        )}

        <Button variant="solid" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
          <Upload size={12} /> Unggah gambar sendiri
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { onPickImage(e.target.files?.[0]); e.target.value = '' }}
        />

        <Field label="Gelapkan" hint="scrim hitam">
          <Slider value={overlay.dim} min={0} max={0.85} step={0.05} onChange={(dim) => patchOverlay({ dim })} />
        </Field>
        <Field label="Blur">
          <Slider value={overlay.blur} min={0} max={40} suffix="px" onChange={(blur) => patchOverlay({ blur })} />
        </Field>
      </Section>

      <Section title="Tipografi">
        <Field label="Font">
          <Select
            className="flex-1 h-7"
            value={type.fontFamily}
            onChange={(fontFamily) => patchTypography({ fontFamily })}
            options={FONT_OPTIONS.map((f) => ({ value: f.value, label: f.label }))}
          />
        </Field>
        <Field label="Ukuran" hint="% tinggi layar">
          <Slider value={type.size} min={2} max={14} step={0.1} onChange={(size) => patchTypography({ size })} />
        </Field>
        <Field label="Ketebalan">
          <Slider value={type.weight} min={300} max={900} step={100} onChange={(weight) => patchTypography({ weight })} />
        </Field>
        <Field label="Warna">
          <ColorField value={type.color} onChange={(color) => patchTypography({ color })} />
        </Field>
        <Field label="Jarak baris">
          <Slider value={type.lineHeight} min={0.9} max={2.2} step={0.05} onChange={(lineHeight) => patchTypography({ lineHeight })} />
        </Field>
        <Field label="Jarak huruf">
          <Slider value={type.letterSpacing} min={-3} max={12} step={0.5} suffix="px" onChange={(letterSpacing) => patchTypography({ letterSpacing })} />
        </Field>
        <Field label="Bayangan">
          <Slider value={type.shadow} min={0} max={40} suffix="px" onChange={(shadow) => patchTypography({ shadow })} />
        </Field>
        <Field label="Garis tepi">
          <Slider value={type.outline} min={0} max={6} step={0.5} suffix="px" onChange={(outline) => patchTypography({ outline })} />
        </Field>
        {type.outline > 0 && (
          <Field label="Warna tepi">
            <ColorField value={type.outlineColor} onChange={(outlineColor) => patchTypography({ outlineColor })} />
          </Field>
        )}
        <Field label="HURUF BESAR">
          <Toggle checked={type.uppercase} onChange={(uppercase) => patchTypography({ uppercase })} />
        </Field>
      </Section>

      <Section title="Tata Letak">
        <Field label="Rata teks">
          <Segmented
            value={layout.align}
            onChange={(align) => patchLayout({ align })}
            options={[
              { value: 'left', label: <AlignLeft size={13} />, title: 'Rata kiri' },
              { value: 'center', label: <AlignCenter size={13} />, title: 'Rata tengah' },
              { value: 'right', label: <AlignRight size={13} />, title: 'Rata kanan' },
            ]}
          />
        </Field>
        <Field label="Posisi">
          <Segmented
            value={layout.verticalAlign}
            onChange={(verticalAlign) => patchLayout({ verticalAlign })}
            options={[
              { value: 'top', label: <ArrowUpToLine size={13} />, title: 'Atas' },
              { value: 'middle', label: <FoldVertical size={13} />, title: 'Tengah' },
              { value: 'bottom', label: <ArrowDownToLine size={13} />, title: 'Bawah' },
            ]}
          />
        </Field>
        <Field label="Padding">
          <Slider value={layout.padding} min={0} max={22} suffix="%" onChange={(padding) => patchLayout({ padding })} />
        </Field>
        <Field label="Lebar teks">
          <Slider value={layout.maxWidth} min={40} max={100} suffix="%" onChange={(maxWidth) => patchLayout({ maxWidth })} />
        </Field>
        <Field label="Referensi">
          <Segmented
            value={layout.referencePosition}
            onChange={(referencePosition) => patchLayout({ referencePosition })}
            options={[
              { value: 'top', label: 'Atas' },
              { value: 'bottom', label: 'Bawah' },
              { value: 'hidden', label: 'Sembunyi' },
            ]}
          />
        </Field>
        {layout.referencePosition !== 'hidden' && (
          <>
            <Field label="Ukuran ref" hint="relatif ke ayat">
              <Slider
                value={layout.referenceScale} min={0.2} max={0.9} step={0.02}
                onChange={(referenceScale) => patchLayout({ referenceScale })}
              />
            </Field>
            <Field label="Tampil versi">
              <Toggle checked={layout.showTranslation} onChange={(showTranslation) => patchLayout({ showTranslation })} />
            </Field>
          </>
        )}
      </Section>

      <Section title="Transisi">
        <Field label="Efek">
          <Select
            className="flex-1 h-7"
            value={transition.kind}
            onChange={(kind) => patchTransition({ kind })}
            options={[
              { value: 'none', label: 'Tanpa efek' },
              { value: 'fade', label: 'Fade' },
              { value: 'slide-up', label: 'Slide ke atas' },
              { value: 'zoom', label: 'Zoom' },
            ]}
          />
        </Field>
        {transition.kind !== 'none' && (
          <Field label="Durasi">
            <Slider
              value={transition.duration} min={100} max={1500} step={20} suffix="ms"
              onChange={(duration) => patchTransition({ duration })}
            />
          </Field>
        )}
      </Section>

      <div className="px-4 py-5 flex items-start gap-2 text-[10px] leading-relaxed text-ink-400">
        <Palette size={12} className="shrink-0 mt-px" />
        <p>
          Semua perubahan langsung terkirim ke layar output. Simpan sebagai preset
          lewat tombol <TypeIcon size={9} className="inline" /> Simpan agar bisa
          dipakai lagi minggu depan.
        </p>
      </div>
    </div>
  )
}
