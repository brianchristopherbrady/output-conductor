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
    case 'cached':
      return 'text-emerald-400';
    case 'running':
    case 'pending':
      return 'text-indigo-400';
    case 'failed':
    case 'error':
      return 'text-red-400';
    case 'retrying':
      return 'text-amber-400';
    default:
      return 'text-zinc-400';
  }
}

export function getStatusBg(status: string): string {
  switch (status) {
    case 'completed':
    case 'success':
    case 'cached':
      return 'bg-emerald-400/10 border-emerald-400/20';
    case 'running':
    case 'pending':
      return 'bg-indigo-400/10 border-indigo-400/20';
    case 'failed':
    case 'error':
      return 'bg-red-400/10 border-red-400/20';
    case 'retrying':
      return 'bg-amber-400/10 border-amber-400/20';
    default:
      return 'bg-zinc-400/10 border-zinc-400/20';
  }
}

export function getStatusDot(status: string): string {
  switch (status) {
    case 'completed':
    case 'success':
    case 'cached':
      return 'bg-emerald-400';
    case 'running':
    case 'pending':
      return 'bg-indigo-400';
    case 'failed':
    case 'error':
      return 'bg-red-400';
    case 'retrying':
      return 'bg-amber-400';
    default:
      return 'bg-zinc-400';
  }
}
