import type { Theme } from '../types/theme'

/** Sensible typography defaults shared by every built-in preset. */
const baseTypography = {
  fontFamily: 'Inter',
  size: 6.2,
  weight: 600,
  color: '#ffffff',
  lineHeight: 1.3,
  letterSpacing: 0,
  uppercase: false,
  shadow: 8,
  outline: 0,
  outlineColor: '#000000',
}

const baseLayout = {
  align: 'center' as const,
  verticalAlign: 'middle' as const,
  padding: 8,
  maxWidth: 82,
  referencePosition: 'bottom' as const,
  referenceScale: 0.42,
  showTranslation: true,
  autoFit: true,
}

export const BUILTIN_THEMES: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    builtin: true,
    background: {
      kind: 'gradient', shape: 'linear', angle: 160,
      stops: [{ color: '#0b1224', at: 0 }, { color: '#1c2b52', at: 55 }, { color: '#0a0f1e', at: 100 }],
    },
    overlay: { dim: 0, blur: 0 },
    typography: { ...baseTypography },
    layout: { ...baseLayout },
    transition: { kind: 'fade', duration: 420 },
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    builtin: true,
    background: {
      kind: 'gradient', shape: 'linear', angle: 135,
      stops: [{ color: '#f7b267', at: 0 }, { color: '#e8646a', at: 52 }, { color: '#7b2d6b', at: 100 }],
    },
    overlay: { dim: 0.12, blur: 0 },
    typography: { ...baseTypography, weight: 700, shadow: 14 },
    layout: { ...baseLayout },
    transition: { kind: 'fade', duration: 420 },
  },
  {
    id: 'parchment',
    name: 'Parchment',
    builtin: true,
    background: {
      kind: 'gradient', shape: 'radial', angle: 0,
      stops: [{ color: '#faf3e3', at: 0 }, { color: '#e8dcc0', at: 100 }],
    },
    overlay: { dim: 0, blur: 0 },
    typography: {
      ...baseTypography, color: '#3a2c17', weight: 500, shadow: 0,
      fontFamily: 'Georgia', size: 5.8, lineHeight: 1.4,
    },
    layout: { ...baseLayout, maxWidth: 74 },
    transition: { kind: 'fade', duration: 520 },
  },
  {
    id: 'stage-black',
    name: 'Stage Black',
    builtin: true,
    background: { kind: 'solid', color: '#000000' },
    overlay: { dim: 0, blur: 0 },
    typography: { ...baseTypography, size: 6.8, weight: 700, shadow: 0, letterSpacing: -0.5 },
    layout: { ...baseLayout, referencePosition: 'top' },
    transition: { kind: 'slide-up', duration: 380 },
  },
  {
    id: 'forest',
    name: 'Forest',
    builtin: true,
    background: {
      kind: 'gradient', shape: 'linear', angle: 195,
      stops: [{ color: '#14372e', at: 0 }, { color: '#0b201b', at: 100 }],
    },
    overlay: { dim: 0.08, blur: 0 },
    typography: { ...baseTypography, color: '#f2f7f1', shadow: 10 },
    layout: { ...baseLayout, align: 'left', maxWidth: 76 },
    transition: { kind: 'fade', duration: 420 },
  },
  {
    id: 'ivory',
    name: 'Ivory',
    builtin: true,
    background: { kind: 'solid', color: '#f5f5f2' },
    overlay: { dim: 0, blur: 0 },
    typography: { ...baseTypography, color: '#16181d', weight: 600, shadow: 0, size: 5.9 },
    layout: { ...baseLayout, maxWidth: 78 },
    transition: { kind: 'zoom', duration: 400 },
  },
]

/** Font stacks offered in the design panel, keyed by the value stored on a theme. */
export const FONT_OPTIONS: Array<{ label: string; value: string; stack: string }> = [
  { label: 'Inter', value: 'Inter', stack: 'Inter, ui-sans-serif, system-ui, "Segoe UI", sans-serif' },
  { label: 'Segoe UI', value: 'Segoe UI', stack: '"Segoe UI", ui-sans-serif, system-ui, sans-serif' },
  { label: 'Georgia', value: 'Georgia', stack: 'Georgia, "Times New Roman", serif' },
  { label: 'Playfair', value: 'Playfair', stack: '"Playfair Display", Georgia, serif' },
  { label: 'Trebuchet', value: 'Trebuchet', stack: '"Trebuchet MS", ui-sans-serif, sans-serif' },
  { label: 'Verdana', value: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
  { label: 'Courier', value: 'Courier', stack: '"Courier New", ui-monospace, monospace' },
  { label: 'Impact', value: 'Impact', stack: 'Impact, "Arial Black", sans-serif' },
]

export function fontStack(value: string): string {
  return FONT_OPTIONS.find((f) => f.value === value)?.stack ?? FONT_OPTIONS[0].stack
}

/** Gradient presets offered as one-click swatches in the background picker. */
export const GRADIENT_SWATCHES: Array<{ name: string; stops: Array<{ color: string; at: number }>; angle: number }> = [
  { name: 'Dusk', angle: 160, stops: [{ color: '#0b1224', at: 0 }, { color: '#1c2b52', at: 100 }] },
  { name: 'Ember', angle: 135, stops: [{ color: '#f7b267', at: 0 }, { color: '#7b2d6b', at: 100 }] },
  { name: 'Ocean', angle: 200, stops: [{ color: '#0f4c81', at: 0 }, { color: '#04182b', at: 100 }] },
  { name: 'Moss', angle: 195, stops: [{ color: '#14372e', at: 0 }, { color: '#0b201b', at: 100 }] },
  { name: 'Plum', angle: 150, stops: [{ color: '#3b1e54', at: 0 }, { color: '#12071c', at: 100 }] },
  { name: 'Slate', angle: 180, stops: [{ color: '#3a4256', at: 0 }, { color: '#14171f', at: 100 }] },
  { name: 'Rose', angle: 140, stops: [{ color: '#c9748b', at: 0 }, { color: '#3d1830', at: 100 }] },
  { name: 'Gold', angle: 145, stops: [{ color: '#d4a24c', at: 0 }, { color: '#4a2f0d', at: 100 }] },
]
