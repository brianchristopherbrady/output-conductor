import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import { DesignSystemProvider, useDesignSystem } from '@/design-system';

function wrapper({ children }: { children: ReactNode }) {
  return <DesignSystemProvider>{children}</DesignSystemProvider>;
}

describe('DesignSystem', () => {
  it('provides default theme and density', () => {
    const { result } = renderHook(() => useDesignSystem(), { wrapper });
    expect(result.current.theme).toBe('dark');
    expect(result.current.density).toBe('comfortable');
  });

  it('can switch to light theme', () => {
    const { result } = renderHook(() => useDesignSystem(), { wrapper });
    act(() => {
      result.current.setTheme('light');
    });
    expect(result.current.theme).toBe('light');
    expect(result.current.colors.bgApp).toBe('#ffffff');
  });

  it('can switch to dark theme', () => {
    const { result } = renderHook(() => useDesignSystem(), { wrapper });
    act(() => {
      result.current.setTheme('dark');
    });
    expect(result.current.theme).toBe('dark');
    expect(result.current.colors.bgApp).toBe('#09090b');
  });

  it('can change density to compact', () => {
    const { result } = renderHook(() => useDesignSystem(), { wrapper });
    act(() => {
      result.current.setDensity('compact');
    });
    expect(result.current.density).toBe('compact');
  });

  it('can change density to spacious', () => {
    const { result } = renderHook(() => useDesignSystem(), { wrapper });
    act(() => {
      result.current.setDensity('spacious');
    });
    expect(result.current.density).toBe('spacious');
  });

  it('provides color palette for current theme', () => {
    const { result } = renderHook(() => useDesignSystem(), { wrapper });
    const { colors } = result.current;
    expect(colors.textPrimary).toBeDefined();
    expect(colors.statusSuccess).toBeDefined();
    expect(colors.accentPrimary).toBeDefined();
    expect(colors.cardBg).toBeDefined();
  });

  it('throws if used outside provider', () => {
    expect(() => {
      renderHook(() => useDesignSystem());
    }).toThrow('useDesignSystem must be used within DesignSystemProvider');
  });
});
