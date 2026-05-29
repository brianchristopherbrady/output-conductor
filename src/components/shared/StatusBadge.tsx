import { motion } from 'framer-motion';
import { getStatusBackground, getStatusBorder, getStatusColor, getStatusDot } from '@/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function StatusBadge({ status, size = 'sm', pulse = false }: StatusBadgeProps) {
  const borderColor = status === 'pending' ? 'var(--ds-border-secondary)' : getStatusBorder(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${size === 'md' ? 'px-2.5 py-1 text-sm' : ''}`}
      style={{
        color: getStatusColor(status),
        borderColor,
        backgroundColor: getStatusBackground(status),
      }}
    >
      <span className="relative flex h-1.5 w-1.5">
        {(pulse || status === 'running') && (
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: getStatusDot(status) }}
            animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: getStatusDot(status) }}
        />
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
  const trendColor =
    trend === 'up'
      ? 'var(--ds-status-success)'
      : trend === 'down'
        ? 'var(--ds-status-error)'
        : 'var(--ds-text-muted)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border p-4 backdrop-blur-sm"
      style={{
        borderColor: 'var(--ds-border-primary)',
        backgroundColor: 'var(--ds-bg-secondary)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--ds-text-muted)]">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-[var(--ds-text-primary)]">{value}</p>
          {subvalue && (
            <p className="text-xs font-medium" style={{ color: trendColor }}>
              {subvalue}
            </p>
          )}
        </div>
        <div
          className="rounded-lg p-2 text-[var(--ds-text-secondary)]"
          style={{ backgroundColor: 'var(--ds-bg-tertiary)' }}
        >
          {icon}
        </div>
      </div>
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(135deg, var(--ds-bg-tertiary), transparent 70%)' }}
      />
    </motion.div>
  );
}
