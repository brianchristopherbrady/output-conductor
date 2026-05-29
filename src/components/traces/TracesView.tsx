import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { WorkflowExecution, Trace } from '@/types';
import { formatDuration, getStatusBackground, getStatusColor } from '@/utils';

interface TracesViewProps {
  executions: WorkflowExecution[];
}

function getTraceTypeStyles(type: Trace['type']) {
  switch (type) {
    case 'http':
      return {
        color: 'var(--ds-status-running)',
        backgroundColor: 'var(--ds-bg-tertiary)',
        borderColor: 'var(--ds-border-secondary)',
      };
    case 'tool':
      return {
        color: 'var(--ds-status-warning)',
        backgroundColor: 'var(--ds-bg-tertiary)',
        borderColor: 'var(--ds-border-secondary)',
      };
    case 'eval':
      return {
        color: 'var(--ds-status-success)',
        backgroundColor: 'var(--ds-bg-tertiary)',
        borderColor: 'var(--ds-border-secondary)',
      };
    default:
      return {
        color: 'var(--ds-text-secondary)',
        backgroundColor: 'var(--ds-bg-tertiary)',
        borderColor: 'var(--ds-border-secondary)',
      };
  }
}

export function TracesView({ executions }: TracesViewProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const allTraces = useMemo(() => {
    return executions
      .flatMap(exec =>
        exec.steps.flatMap(step =>
          step.traces.map(trace => ({
            ...trace,
            workflowName: exec.workflowName,
            workflowId: exec.id,
            stepName: step.name,
          })),
        ),
      )
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, 2000);
  }, [executions]);

  const virtualizer = useVirtualizer({
    count: allTraces.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 20,
  });

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: 'var(--ds-border-primary)' }}
      >
        <h3 className="text-sm font-medium text-[var(--ds-text-primary)]">
          All Traces ({allTraces.length.toLocaleString()})
        </h3>
        <div className="flex gap-2 text-xs text-[var(--ds-text-muted)]">
          <span className="rounded-full border px-2 py-0.5" style={getTraceTypeStyles('llm')}>
            LLM: {allTraces.filter(t => t.type === 'llm').length}
          </span>
          <span className="rounded-full border px-2 py-0.5" style={getTraceTypeStyles('http')}>
            HTTP: {allTraces.filter(t => t.type === 'http').length}
          </span>
          <span className="rounded-full border px-2 py-0.5" style={getTraceTypeStyles('tool')}>
            Tool: {allTraces.filter(t => t.type === 'tool').length}
          </span>
          <span className="rounded-full border px-2 py-0.5" style={getTraceTypeStyles('eval')}>
            Eval: {allTraces.filter(t => t.type === 'eval').length}
          </span>
        </div>
      </div>

      <div
        className="grid grid-cols-[80px_1fr_120px_100px_80px_80px] gap-2 border-b px-4 py-2 text-[10px] uppercase tracking-wider text-[var(--ds-text-tertiary)]"
        style={{ borderColor: 'var(--ds-border-primary)' }}
      >
        <span>Type</span>
        <span>Name</span>
        <span>Workflow</span>
        <span>Step</span>
        <span>Duration</span>
        <span>Status</span>
      </div>

      <div ref={parentRef} className="flex-1 overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const trace = allTraces[virtualItem.index];
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
                <div
                  className="grid grid-cols-[80px_1fr_120px_100px_80px_80px] items-center gap-2 border-b px-4 py-2 text-xs transition-colors hover:bg-[var(--ds-bg-secondary)]"
                  style={{
                    borderColor: 'var(--ds-border-primary)',
                    backgroundColor:
                      trace.status === 'error' ? getStatusBackground(trace.status) : 'transparent',
                  }}
                >
                  <span
                    className="w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={getTraceTypeStyles(trace.type)}
                  >
                    {trace.type}
                  </span>
                  <span className="truncate font-mono text-[11px] text-[var(--ds-text-primary)]">
                    {trace.name}
                  </span>
                  <span className="truncate text-[var(--ds-text-muted)]">{trace.workflowName}</span>
                  <span className="truncate text-[var(--ds-text-muted)]">{trace.stepName}</span>
                  <span className="font-mono text-[var(--ds-text-secondary)]">
                    {formatDuration(trace.duration)}
                  </span>
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: getStatusColor(trace.status) }}
                  >
                    {trace.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
