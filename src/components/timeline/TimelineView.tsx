import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { WorkflowExecution } from '@/types';
import { formatDuration, getStatusColor } from '@/utils';

interface TimelineViewProps {
  executions: WorkflowExecution[];
  onSelect: (execution: WorkflowExecution) => void;
}

function getTimelineStatusColor(status: string) {
  switch (status) {
    case 'cached':
      return 'var(--ds-status-cached)';
    case 'retrying':
      return 'var(--ds-status-warning)';
    default:
      return getStatusColor(status);
  }
}

export function TimelineView({ executions, onSelect }: TimelineViewProps) {
  const recentExecutions = useMemo(() => executions.slice(0, 50), [executions]);

  const timeRange = useMemo(() => {
    if (recentExecutions.length === 0) return { start: 0, end: 1 };
    const times = recentExecutions.map(e => e.startedAt.getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    return { start: min, end: max || min + 1 };
  }, [recentExecutions]);

  return (
    <div className="p-4">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-[var(--ds-text-muted)]">
        Execution Timeline (last 50)
      </h3>

      <div className="relative">
        <div className="mb-4 flex items-center justify-between text-xs text-[var(--ds-text-tertiary)]">
          <span>Oldest</span>
          <span>Most Recent</span>
        </div>

        <div className="space-y-2">
          {(() => {
            const grouped: Record<string, WorkflowExecution[]> = {};
            recentExecutions.forEach(e => {
              if (!grouped[e.workflowName]) grouped[e.workflowName] = [];
              grouped[e.workflowName].push(e);
            });

            return Object.entries(grouped).map(([name, execs]) => (
              <div key={name} className="group">
                <div className="mb-1 flex items-center gap-2">
                  <span className="w-44 truncate text-xs font-mono text-[var(--ds-text-secondary)]">
                    {name}
                  </span>
                  <span className="text-[10px] text-[var(--ds-text-tertiary)]">{execs.length} runs</span>
                </div>
                <div
                  className="relative h-8 rounded-md border"
                  style={{
                    backgroundColor: 'var(--ds-bg-secondary)',
                    borderColor: 'var(--ds-border-primary)',
                  }}
                >
                  {execs.map((exec) => {
                    const left = ((exec.startedAt.getTime() - timeRange.start) / (timeRange.end - timeRange.start)) * 100;
                    const width = Math.max(0.5, ((exec.duration || 1000) / (timeRange.end - timeRange.start)) * 100);

                    return (
                      <motion.div
                        key={exec.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.8, scale: 1 }}
                        whileHover={{ scale: 1.3, zIndex: 50, opacity: 1 }}
                        onClick={() => onSelect(exec)}
                        className={`absolute top-1 h-6 cursor-pointer rounded transition-shadow hover:shadow-lg ${exec.status === 'running' ? 'animate-pulse' : ''}`}
                        style={{
                          left: `${Math.min(left, 99)}%`,
                          width: `${Math.max(width, 0.5)}%`,
                          minWidth: '4px',
                          backgroundColor: getTimelineStatusColor(exec.status),
                        }}
                        title={`${exec.workflowName} — ${exec.status} — ${exec.duration ? formatDuration(exec.duration) : 'running'}`}
                      />
                    );
                  })}
                </div>
              </div>
            ));
          })()}
        </div>

        <div className="mt-6 flex items-center gap-4 text-xs text-[var(--ds-text-muted)]">
          <span className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'var(--ds-status-success)' }} />
            Completed
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'var(--ds-status-error)' }} />
            Failed
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'var(--ds-status-running)' }} />
            Running
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: 'var(--ds-status-warning)' }} />
            Retrying
          </span>
        </div>
      </div>
    </div>
  );
}
