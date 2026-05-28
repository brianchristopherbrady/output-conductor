/**
 * Conductor Design System — Token Definitions
 *
 * This is the single source of truth for all design tokens.
 * Tokens are organized into semantic categories and consumed
 * via CSS custom properties. Themes override these values.
 */

// ─── Spacing Scale ───────────────────────────────────────────
// Based on a 4px grid. Density modes multiply this base.
export const SPACING_SCALE = {
  0: '0px',
  px: '1px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
} as const;

// ─── Typography Scale ────────────────────────────────────────
export const FONT_SIZE = {
  xs: ['0.75rem', { lineHeight: '1rem' }],
  sm: ['0.875rem', { lineHeight: '1.25rem' }],
  base: ['1rem', { lineHeight: '1.5rem' }],
  lg: ['1.125rem', { lineHeight: '1.75rem' }],
  xl: ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
} as const;

export const FONT_WEIGHT = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const FONT_FAMILY = {
  sans: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

// ─── Radius Scale ────────────────────────────────────────────
export const RADIUS = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',
} as const;

// ─── Shadows ─────────────────────────────────────────────────
export const SHADOW = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  glow: '0 0 20px -5px',
} as const;

// ─── Transitions ─────────────────────────────────────────────
export const DURATION = {
  instant: '0ms',
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

export const EASING = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

// ─── Z-Index Scale ───────────────────────────────────────────
export const Z_INDEX = {
  base: '0',
  raised: '10',
  dropdown: '100',
  sticky: '200',
  overlay: '300',
  modal: '400',
  popover: '500',
  toast: '600',
  tooltip: '700',
} as const;

// ─── Density Modes ───────────────────────────────────────────
export type DensityMode = 'compact' | 'comfortable' | 'spacious';

export const DENSITY_MULTIPLIERS: Record<DensityMode, number> = {
  compact: 0.75,
  comfortable: 1,
  spacious: 1.35,
};

export const DENSITY_CONFIG: Record<DensityMode, {
  cardPaddingX: string;
  cardPaddingY: string;
  listGap: string;
  headerPadding: string;
  fontSize: string;
  rowHeight: string;
  iconSize: string;
  badgePadding: string;
  inputHeight: string;
  borderRadius: string;
}> = {
  compact: {
    cardPaddingX: '12px',
    cardPaddingY: '8px',
    listGap: '4px',
    headerPadding: '12px',
    fontSize: '13px',
    rowHeight: '72px',
    iconSize: '14px',
    badgePadding: '2px 6px',
    inputHeight: '32px',
    borderRadius: '8px',
  },
  comfortable: {
    cardPaddingX: '20px',
    cardPaddingY: '16px',
    listGap: '8px',
    headerPadding: '24px',
    fontSize: '14px',
    rowHeight: '108px',
    iconSize: '16px',
    badgePadding: '4px 10px',
    inputHeight: '40px',
    borderRadius: '12px',
  },
  spacious: {
    cardPaddingX: '28px',
    cardPaddingY: '22px',
    listGap: '12px',
    headerPadding: '32px',
    fontSize: '15px',
    rowHeight: '132px',
    iconSize: '18px',
    badgePadding: '6px 14px',
    inputHeight: '48px',
    borderRadius: '16px',
  },
};
