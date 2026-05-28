import { motion } from 'framer-motion';
import { cn, getStatusDot } from '@/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function StatusBadge({ status, size = 'sm', pulse = false }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
      status === 'completed' && 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
      status === 'cached' && 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
      status === 'running' && 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400',
      status === 'failed' && 'border-red-500/20 bg-red-500/10 text-red-400',
      status === 'error' && 'border-red-500/20 bg-red-500/10 text-red-400',
      status === 'retrying' && 'border-amber-500/20 bg-amber-500/10 text-amber-400',
      status === 'pending' && 'border-zinc-500/20 bg-zinc-500/10 text-zinc-400',
      status === 'success' && 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
      size === 'md' && 'px-2.5 py-1 text-sm',
    )}>
      <span className="relative flex h-1.5 w-1.5">
        {(pulse || status === 'running') && (
          <motion.span
            className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', getStatusDot(status))}
            animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', getStatusDot(status))} />
      </span>
      {status}
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  subvalue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export function MetricCard({ label, value, subvalue, icon, trend }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-zinc-100">{value}</p>
          {subvalue && (
            <p className={cn(
              'text-xs font-medium',
              trend === 'up' && 'text-emerald-400',
              trend === 'down' && 'text-red-400',
              trend === 'neutral' && 'text-zinc-500',
            )}>
              {subvalue}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-2 text-zinc-400">
          {icon}
        </div>
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-zinc-800/20 to-transparent" />
    </motion.div>
  );
}
