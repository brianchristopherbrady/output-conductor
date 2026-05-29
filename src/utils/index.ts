import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}k`;
  return `${(tokens / 1000000).toFixed(2)}M`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
    case 'success':
      return 'var(--ds-status-success)';
    case 'cached':
      return 'var(--ds-status-cached)';
    case 'running':
    case 'pending':
      return 'var(--ds-status-running)';
    case 'failed':
    case 'error':
      return 'var(--ds-status-error)';
    case 'retrying':
      return 'var(--ds-status-warning)';
    default:
      return 'var(--ds-text-secondary)';
  }
}

export function getStatusBackground(status: string): string {
  switch (status) {
    case 'completed':
    case 'success':
      return 'var(--ds-status-success-bg)';
    case 'failed':
    case 'error':
      return 'var(--ds-status-error-bg)';
    default:
      return 'var(--ds-bg-tertiary)';
  }
}

export function getStatusBorder(status: string): string {
  switch (status) {
    case 'completed':
    case 'success':
      return 'var(--ds-status-success)';
    case 'cached':
      return 'var(--ds-status-cached)';
    case 'running':
      return 'var(--ds-status-running)';
    case 'failed':
    case 'error':
      return 'var(--ds-status-error)';
    case 'retrying':
      return 'var(--ds-status-warning)';
    default:
      return 'var(--ds-border-secondary)';
  }
}

export function getStatusBg(status: string): string {
  return getStatusBackground(status);
}

export function getStatusDot(status: string): string {
  return getStatusColor(status);
}
