import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { WorkflowExecution, Trace } from '@/types';
import { formatDuration, getStatusBackground, getStatusColor } from '@/utils';
import { useDesignSystem } from '@/design-system';
import { DENSITY_CONFIG } from '@/design-system/tokens';

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
  const { density } = useDesignSystem();

  const traceRowHeight = parseInt(DENSITY_CONFIG[density].tableRowHeight, 10);

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
    estimateSize: () => traceRowHeight,
    overscan: 20,
  });

  return (
    <div className="trace-table flex h-full flex-col">
      <div
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b"
        style={{ borderColor: 'var(--ds-border-primary)', padding: `var(--ds-section-py, 12px) var(--ds-panel-px, 16px)` }}
      >
        <h3 className="text-sm font-medium text-[var(--ds-text-primary)]">
          All Traces ({allTraces.length.toLocaleString()})
        </h3>
        <div className="flex flex-wrap gap-2 whitespace-nowrap text-xs text-[var(--ds-text-muted)]">
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
        className="trace-row-head border-b text-[10px] uppercase tracking-wider text-[var(--ds-text-tertiary)]"
        style={{ borderColor: 'var(--ds-border-primary)', padding: 'var(--ds-table-header-padding, 8px 16px)' }}
      >
        <span>Type</span>
        <span>Name</span>
        <span>Workflow</span>
        <span>Step</span>
        <span>Duration</span>
        <span>Status</span>
      </div>

      <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
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
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div
                  className="trace-row border-b text-xs transition-colors hover:bg-[var(--ds-bg-secondary)]"
                  style={{
                    borderColor: 'var(--ds-border-primary)',
                    minHeight: 'var(--ds-table-row-height)',
                    padding: 'var(--ds-table-header-padding, 8px 16px)',
                    backgroundColor:
                      trace.status === 'error' ? getStatusBackground(trace.status) : 'transparent',
                  }}
                >
                  <span
                    className="w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide [grid-area:type]"
                    style={getTraceTypeStyles(trace.type)}
                  >
                    {trace.type}
                  </span>
                  <span className="truncate font-mono text-[11px] text-[var(--ds-text-primary)] [grid-area:name]">
                    {trace.name}
                  </span>
                  <span className="truncate text-[var(--ds-text-muted)] [grid-area:workflow]">{trace.workflowName}</span>
                  <span className="truncate text-[var(--ds-text-muted)] [grid-area:step]">{trace.stepName}</span>
                  <span className="justify-self-end font-mono text-[var(--ds-text-secondary)] [grid-area:duration] @2xl:justify-self-stretch">
                    {formatDuration(trace.duration)}
                  </span>
                  <span
                    className="justify-self-end text-[10px] font-medium [grid-area:status] @2xl:justify-self-stretch"
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
