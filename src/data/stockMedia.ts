import type { Background } from '../types/theme'

/**
 * Curated stock backgrounds always available out-of-the-box in the Media Bin.
 * Gives worship operators high-quality church presentation backgrounds without
 * needing to hunt for image files first.
 */
export const STOCK_BACKGROUNDS: Background[] = [
  {
    kind: 'gradient',
    shape: 'linear',
    angle: 160,
    stops: [
      { color: '#0b1224', at: 0 },
      { color: '#1c2b52', at: 55 },
      { color: '#0a0f1e', at: 100 },
    ],
  },
  {
    kind: 'gradient',
    shape: 'linear',
    angle: 135,
    stops: [
      { color: '#f7b267', at: 0 },
      { color: '#e8646a', at: 52 },
      { color: '#7b2d6b', at: 100 },
    ],
  },
  {
    kind: 'gradient',
    shape: 'linear',
    angle: 200,
    stops: [
      { color: '#0f4c81', at: 0 },
      { color: '#04182b', at: 100 },
    ],
  },
  {
    kind: 'gradient',
    shape: 'linear',
    angle: 195,
    stops: [
      { color: '#14372e', at: 0 },
      { color: '#0b201b', at: 100 },
    ],
  },
  {
    kind: 'gradient',
    shape: 'linear',
    angle: 150,
    stops: [
      { color: '#3b1e54', at: 0 },
      { color: '#12071c', at: 100 },
    ],
  },
  {
    kind: 'gradient',
    shape: 'linear',
    angle: 140,
    stops: [
      { color: '#c9748b', at: 0 },
      { color: '#3d1830', at: 100 },
    ],
  },
  {
    kind: 'solid',
    color: '#000000',
  },
  {
    kind: 'solid',
    color: '#0a0f1d',
  },
]
