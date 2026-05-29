import { describe, it, expect } from 'vitest';
import { formatDuration, formatCost, formatTokens, getStatusColor, getStatusBg, cn } from '@/utils';

describe('formatDuration', () => {
  it('formats milliseconds', () => {
    expect(formatDuration(500)).toBe('500ms');
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats seconds', () => {
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(2500)).toBe('2.5s');
    expect(formatDuration(59999)).toBe('60.0s');
  });

  it('formats minutes', () => {
    expect(formatDuration(60000)).toBe('1.0m');
    expect(formatDuration(90000)).toBe('1.5m');
  });
});

describe('formatCost', () => {
  it('formats tiny costs with 4 decimals', () => {
    expect(formatCost(0.0001)).toBe('$0.0001');
    expect(formatCost(0.0099)).toBe('$0.0099');
  });

  it('formats small costs with 3 decimals', () => {
    expect(formatCost(0.01)).toBe('$0.010');
    expect(formatCost(0.123)).toBe('$0.123');
  });

  it('formats larger costs with 2 decimals', () => {
    expect(formatCost(1.5)).toBe('$1.50');
    expect(formatCost(42.99)).toBe('$42.99');
  });
});

describe('formatTokens', () => {
  it('formats small numbers directly', () => {
    expect(formatTokens(500)).toBe('500');
    expect(formatTokens(999)).toBe('999');
  });

  it('formats thousands with k suffix', () => {
    expect(formatTokens(1000)).toBe('1.0k');
    expect(formatTokens(15000)).toBe('15.0k');
  });

  it('formats millions with M suffix', () => {
    expect(formatTokens(1000000)).toBe('1.00M');
    expect(formatTokens(2500000)).toBe('2.50M');
  });
});

describe('getStatusColor', () => {
  it('returns correct color for completed', () => {
    expect(getStatusColor('completed')).toBe('var(--ds-status-success)');
  });

  it('returns correct color for failed', () => {
    expect(getStatusColor('failed')).toBe('var(--ds-status-error)');
  });

  it('returns correct color for running', () => {
    expect(getStatusColor('running')).toBe('var(--ds-status-running)');
  });

  it('returns default for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('var(--ds-text-secondary)');
  });
});

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('deduplicates tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
