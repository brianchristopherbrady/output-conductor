import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Play, XCircle, Zap } from 'lucide-react';
import type { LiveEvent } from '@/hooks/useLiveMode';
import { formatCost, formatDuration, formatTokens } from '@/utils';

interface ToastNotificationProps {
  events: LiveEvent[];
}

interface ToastVisuals {
  icon: typeof Play;
  accentColor: string;
  iconBackground: string;
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
});

function getToastVisuals(event: LiveEvent): ToastVisuals {
  switch (event.type) {
    case 'execution_started':
      return {
        icon: Play,
        accentColor: 'var(--ds-status-info)',
        iconBackground: 'var(--ds-status-info-bg)',
      };
    case 'execution_completed':
      return {
        icon: CheckCircle2,
        accentColor: 'var(--ds-status-success)',
        iconBackground: 'var(--ds-status-success-bg)',
      };
    case 'step_completed':
      return {
        icon: Zap,
        accentColor: 'var(--ds-status-success)',
        iconBackground: 'var(--ds-status-success-bg)',
      };
    case 'execution_failed':
    case 'step_failed':
      return {
        icon: XCircle,
        accentColor: 'var(--ds-status-error)',
        iconBackground: 'var(--ds-status-error-bg)',
      };
  }
}

function getEventDescription(event: LiveEvent): string {
  const { details } = event;

  switch (event.type) {
    case 'execution_started':
      return `Execution started${details.model ? ` • ${details.model}` : ''}`;
    case 'execution_completed': {
      const parts = [
        details.duration ? `Completed in ${formatDuration(details.duration)}` : 'Execution completed',
        details.totalTokens ? `${formatTokens(details.totalTokens)} tokens` : null,
        typeof details.totalCost === 'number' ? formatCost(details.totalCost) : null,
      ].filter(Boolean);

      return parts.join(' • ');
    }
    case 'execution_failed':
      return `${details.stepName ?? 'Execution'} failed${details.retryCount ? ` • retry ${details.retryCount}` : ''}`;
    case 'step_completed':
      return `${details.stepName ?? 'Step'} completed${details.duration ? ` in ${formatDuration(details.duration)}` : ''}`;
    case 'step_failed':
      return `${details.stepName ?? 'Step'} failed${details.duration ? ` after ${formatDuration(details.duration)}` : ''}`;
  }
}

function formatWorkflowName(workflowName: string): string {
  return workflowName.replace(/_/g, ' ');
}

export function ToastNotification({ events }: ToastNotificationProps) {
  const [visibleToasts, setVisibleToasts] = useState<LiveEvent[]>([]);
  const seenEventIdsRef = useRef<Set<string>>(new Set());
  const dismissTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const newEvents = [...events]
      .reverse()
      .filter(event => !seenEventIdsRef.current.has(event.id));

    newEvents.forEach(event => {
      seenEventIdsRef.current.add(event.id);

      setVisibleToasts(current => [event, ...current.filter(toast => toast.id !== event.id)].slice(0, 4));

      const existingTimer = dismissTimersRef.current.get(event.id);
      if (existingTimer) {
        window.clearTimeout(existingTimer);
      }

      const timer = window.setTimeout(() => {
        setVisibleToasts(current => current.filter(toast => toast.id !== event.id));
        dismissTimersRef.current.delete(event.id);
      }, 4000);

      dismissTimersRef.current.set(event.id, timer);
    });
  }, [events]);

  useEffect(() => {
    return () => {
      dismissTimersRef.current.forEach(timer => window.clearTimeout(timer));
      dismissTimersRef.current.clear();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence initial={false}>
        {visibleToasts.map(event => {
          const visuals = getToastVisuals(event);
          const Icon = visuals.icon;

          return (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, x: 32, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="pointer-events-auto overflow-hidden rounded-xl border border-l-[3px] backdrop-blur-xl"
              style={{
                borderColor: 'var(--ds-border-primary)',
                borderLeftColor: visuals.accentColor,
                backgroundColor: 'color-mix(in srgb, var(--ds-bg-elevated) 78%, transparent)',
                boxShadow: '0 12px 32px var(--ds-shadow-color)',
              }}
            >
              <div className="flex items-start gap-3 px-3 py-2.5">
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    color: visuals.accentColor,
                    backgroundColor: visuals.iconBackground,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className="truncate text-xs font-semibold capitalize"
                      style={{ color: 'var(--ds-text-primary)' }}
                    >
                      {formatWorkflowName(event.workflowName)}
                    </p>
                    <span className="shrink-0 text-[10px]" style={{ color: 'var(--ds-text-muted)' }}>
                      {timeFormatter.format(event.timestamp)}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] leading-4" style={{ color: 'var(--ds-text-secondary)' }}>
                    {getEventDescription(event)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
