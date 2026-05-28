/**
 * Conductor Design System — Color Palettes
 *
 * Semantic color tokens used across the entire app.
 * Each theme provides its own mapping for these tokens.
 */

export interface ColorPalette {
  // ─── Surface & Background ────────────────────────────────
  bgApp: string;
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;
  bgHover: string;
  bgActive: string;
  bgOverlay: string;

  // ─── Text ────────────────────────────────────────────────
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textInverse: string;

  // ─── Borders ─────────────────────────────────────────────
  borderPrimary: string;
  borderSecondary: string;
  borderFocus: string;

  // ─── Brand / Accent ──────────────────────────────────────
  accentPrimary: string;
  accentHover: string;
  accentMuted: string;
  accentSubtle: string;

  // ─── Semantic Status ─────────────────────────────────────
  statusSuccess: string;
  statusSuccessMuted: string;
  statusSuccessBg: string;
  statusWarning: string;
  statusWarningMuted: string;
  statusWarningBg: string;
  statusError: string;
  statusErrorMuted: string;
  statusErrorBg: string;
  statusInfo: string;
  statusInfoMuted: string;
  statusInfoBg: string;
  statusCached: string;
  statusCachedMuted: string;
  statusCachedBg: string;

  // ─── Component-specific ──────────────────────────────────
  cardBg: string;
  cardBorder: string;
  cardBorderHover: string;
  inputBg: string;
  inputBorder: string;
  inputBorderFocus: string;
  badgeBg: string;
  navBg: string;
  navActive: string;
  navActiveText: string;
  tooltipBg: string;
  tooltipText: string;
  scrollbarThumb: string;
  scrollbarTrack: string;

  // ─── Chart colors ────────────────────────────────────────
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  chart6: string;

  // ─── Shadow colors ───────────────────────────────────────
  shadowColor: string;
  glowColor: string;
}
