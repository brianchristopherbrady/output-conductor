import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ColorPalette } from './tokens/colors';
import { DensityMode, DENSITY_CONFIG } from './tokens';
import { darkTheme } from './themes/dark';
import { lightTheme } from './themes/light';

// ─── Types ───────────────────────────────────────────────────
export type ThemeMode = 'dark' | 'light';

export interface DesignSystemState {
  theme: ThemeMode;
  density: DensityMode;
  colors: ColorPalette;
  setTheme: (theme: ThemeMode) => void;
  setDensity: (density: DensityMode) => void;
}

const STORAGE_KEY_THEME = 'conductor-theme';
const STORAGE_KEY_DENSITY = 'conductor-density';

// ─── Context ─────────────────────────────────────────────────
const DesignSystemContext = createContext<DesignSystemState | null>(null);

export function useDesignSystem(): DesignSystemState {
  const ctx = useContext(DesignSystemContext);
  if (!ctx) throw new Error('useDesignSystem must be used within DesignSystemProvider');
  return ctx;
}

// ─── CSS Variable Injection ──────────────────────────────────
function applyThemeToDOM(colors: ColorPalette) {
  const root = document.documentElement;
  const entries = Object.entries(colors) as [keyof ColorPalette, string][];
  for (const [key, value] of entries) {
    // Convert camelCase to kebab-case: bgApp → --ds-bg-app
    const cssVar = `--ds-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  }
}

function applyDensityToDOM(density: DensityMode) {
  const root = document.documentElement;
  const config = DENSITY_CONFIG[density];
  root.style.setProperty('--ds-card-px', config.cardPaddingX);
  root.style.setProperty('--ds-card-py', config.cardPaddingY);
  root.style.setProperty('--ds-list-gap', config.listGap);
  root.style.setProperty('--ds-header-padding', config.headerPadding);
  root.style.setProperty('--ds-font-size', config.fontSize);
  root.style.setProperty('--ds-row-height', config.rowHeight);
  root.style.setProperty('--ds-icon-size', config.iconSize);
  root.style.setProperty('--ds-badge-padding', config.badgePadding);
  root.style.setProperty('--ds-input-height', config.inputHeight);
  root.style.setProperty('--ds-border-radius', config.borderRadius);
  root.setAttribute('data-density', density);
}

// ─── Provider ────────────────────────────────────────────────
export function DesignSystemProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_THEME) as ThemeMode | null;
    return stored || 'dark';
  });

  const [density, setDensityState] = useState<DensityMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_DENSITY) as DensityMode | null;
    return stored || 'comfortable';
  });

  const colors = theme === 'dark' ? darkTheme : lightTheme;

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY_THEME, t);
  }, []);

  const setDensity = useCallback((d: DensityMode) => {
    setDensityState(d);
    localStorage.setItem(STORAGE_KEY_DENSITY, d);
  }, []);

  // Apply to DOM on changes
  useEffect(() => {
    applyThemeToDOM(colors);
    document.documentElement.setAttribute('data-theme', theme);
  }, [colors, theme]);

  useEffect(() => {
    applyDensityToDOM(density);
  }, [density]);

  return (
    <DesignSystemContext.Provider value={{ theme, density, colors, setTheme, setDensity }}>
      {children}
    </DesignSystemContext.Provider>
  );
}
