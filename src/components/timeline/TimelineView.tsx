import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { WorkflowExecution } from '@/types';
import { cn, formatDuration, getStatusDot } from '@/utils';

interface TimelineViewProps {
  executions: WorkflowExecution[];
  onSelect: (execution: WorkflowExecution) => void;
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
    <div className="h-full overflow-auto p-4">
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-zinc-500">
        Execution Timeline (last 50)
      </h3>

      <div className="relative">
        {/* Time axis */}
        <div className="mb-4 flex items-center justify-between text-xs text-zinc-600">
          <span>Oldest</span>
          <span>Most Recent</span>
        </div>

        {/* Swimlanes by workflow */}
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
                  <span className="text-xs font-mono text-zinc-400 w-44 truncate">{name}</span>
                  <span className="text-[10px] text-zinc-600">{execs.length} runs</span>
                </div>
                <div className="relative h-8 rounded-md bg-zinc-900/50 border border-zinc-800/50">
                  {execs.map((exec) => {
                    const left = ((exec.startedAt.getTime() - timeRange.start) / (timeRange.end - timeRange.start)) * 100;
                    const width = Math.max(0.5, ((exec.duration || 1000) / (timeRange.end - timeRange.start)) * 100);

                    return (
                      <motion.div
                        key={exec.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.3, zIndex: 50 }}
                        onClick={() => onSelect(exec)}
                        className={cn(
                          'absolute top-1 h-6 rounded cursor-pointer transition-shadow hover:shadow-lg',
                          exec.status === 'completed' && 'bg-emerald-500/60 hover:bg-emerald-500/80',
                          exec.status === 'failed' && 'bg-red-500/60 hover:bg-red-500/80',
                          exec.status === 'running' && 'bg-indigo-500/60 hover:bg-indigo-500/80 animate-pulse',
                          exec.status === 'retrying' && 'bg-amber-500/60 hover:bg-amber-500/80',
                        )}
                        style={{
                          left: `${Math.min(left, 99)}%`,
                          width: `${Math.max(width, 0.5)}%`,
                          minWidth: '4px',
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

        {/* Legend */}
        <div className="mt-6 flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500/60" />
            Completed
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-red-500/60" />
            Failed
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-indigo-500/60" />
            Running
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-amber-500/60" />
            Retrying
          </span>
        </div>
      </div>
    </div>
  );
}
