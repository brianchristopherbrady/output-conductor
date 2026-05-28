import { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Coins, Cpu, Zap } from 'lucide-react';
import { WorkflowExecution } from '@/types';
import { cn, formatDuration, formatCost, formatTokens } from '@/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface ExecutionListProps {
  executions: WorkflowExecution[];
  selectedId?: string | null;
  onSelect: (execution: WorkflowExecution) => void;
}

const ExecutionRow = memo(function ExecutionRow({
  execution,
  isSelected,
  onSelect,
}: {
  execution: WorkflowExecution;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const completedSteps = execution.steps.filter(s => s.status === 'completed' || s.status === 'cached').length;
  const totalSteps = execution.steps.length;

  return (
    <motion.div
      layout
      onClick={onSelect}
      className={cn(
        'group cursor-pointer rounded-xl border px-5 py-4 transition-all duration-150',
        isSelected
          ? 'border-conductor-500/40 bg-conductor-500/5 ring-1 ring-conductor-500/20'
          : 'border-zinc-800/60 bg-zinc-900/30 hover:border-zinc-700 hover:bg-zinc-900/60',
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="truncate text-base font-semibold text-zinc-100 group-hover:text-white">
              {execution.workflowName.replace(/_/g, ' ')}
            </h3>
            <StatusBadge status={execution.status} />
          </div>
          <div className="mt-2 flex items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {formatDistanceToNow(execution.startedAt, { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              {completedSteps}/{totalSteps} steps
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              {formatTokens(execution.totalTokens)} tokens
            </span>
            <span className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5" />
              {formatCost(execution.totalCost)}
            </span>
          </div>
        </div>
        {execution.duration && (
          <div className="text-right">
            <span className="text-sm font-mono font-medium text-zinc-400">{formatDuration(execution.duration)}</span>
          </div>
        )}
      </div>

      {/* Step progress bar */}
      <div className="mt-3 flex gap-1">
        {execution.steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              step.status === 'completed' && 'bg-emerald-500',
              step.status === 'cached' && 'bg-cyan-500',
              step.status === 'running' && 'bg-indigo-500 animate-pulse',
              step.status === 'failed' && 'bg-red-500',
              step.status === 'pending' && 'bg-zinc-700',
            )}
          />
        ))}
      </div>
    </motion.div>
  );
});

export function ExecutionList({ executions, selectedId, onSelect }: ExecutionListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: executions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 108,
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const execution = executions[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="px-2 py-1">
                <ExecutionRow
                  execution={execution}
                  isSelected={execution.id === selectedId}
                  onSelect={() => onSelect(execution)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
