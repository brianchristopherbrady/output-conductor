import { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Coins, Cpu, Zap } from 'lucide-react';
import { WorkflowExecution } from '@/types';
import { cn, formatDuration, formatCost, formatTokens } from '@/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useDesignSystem } from '@/design-system';

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
      className="group cursor-pointer transition-all duration-150"
      style={{
        padding: `var(--ds-card-py) var(--ds-card-px)`,
        borderRadius: 'var(--ds-border-radius)',
        border: `1px solid ${isSelected ? 'var(--ds-accent-primary)' : 'var(--ds-card-border)'}`,
        backgroundColor: isSelected ? 'var(--ds-accent-subtle)' : 'var(--ds-card-bg)',
        fontSize: 'var(--ds-font-size)',
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3
              className="truncate font-semibold"
              style={{ color: 'var(--ds-text-primary)', fontSize: 'calc(var(--ds-font-size) + 2px)' }}
            >
              {execution.workflowName.replace(/_/g, ' ')}
            </h3>
            <StatusBadge status={execution.status} />
          </div>
          <div className="mt-2 flex items-center gap-4" style={{ color: 'var(--ds-text-muted)' }}>
            <span className="flex items-center gap-1.5">
              <Clock style={{ width: 'var(--ds-icon-size)', height: 'var(--ds-icon-size)' }} />
              {formatDistanceToNow(execution.startedAt, { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu style={{ width: 'var(--ds-icon-size)', height: 'var(--ds-icon-size)' }} />
              {completedSteps}/{totalSteps} steps
            </span>
            <span className="flex items-center gap-1.5">
              <Zap style={{ width: 'var(--ds-icon-size)', height: 'var(--ds-icon-size)' }} />
              {formatTokens(execution.totalTokens)} tokens
            </span>
            <span className="flex items-center gap-1.5">
              <Coins style={{ width: 'var(--ds-icon-size)', height: 'var(--ds-icon-size)' }} />
              {formatCost(execution.totalCost)}
            </span>
          </div>
        </div>
        {execution.duration && (
          <div className="text-right">
            <span className="font-mono font-medium" style={{ color: 'var(--ds-text-tertiary)' }}>{formatDuration(execution.duration)}</span>
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
              step.status === 'running' && 'animate-pulse',
            )}
            style={{
              backgroundColor:
                step.status === 'completed' ? 'var(--ds-status-success)'
                : step.status === 'cached' ? 'var(--ds-status-cached)'
                : step.status === 'running' ? 'var(--ds-status-info)'
                : step.status === 'failed' ? 'var(--ds-status-error)'
                : 'var(--ds-bg-tertiary)',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
});

export function ExecutionList({ executions, selectedId, onSelect }: ExecutionListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { density } = useDesignSystem();

  const rowHeight = density === 'compact' ? 82 : density === 'spacious' ? 152 : 116;

  const virtualizer = useVirtualizer({
    count: executions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  const listGap = density === 'compact' ? '2px 4px' : density === 'spacious' ? '6px 8px' : '4px 6px';

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
              <div style={{ padding: listGap }}>
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
