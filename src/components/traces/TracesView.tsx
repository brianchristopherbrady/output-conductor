import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { WorkflowExecution, Trace } from '@/types';
import { cn, formatDuration, formatCost, formatTokens } from '@/utils';

interface TracesViewProps {
  executions: WorkflowExecution[];
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
          }))
        )
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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-medium text-zinc-300">
          All Traces ({allTraces.length.toLocaleString()})
        </h3>
        <div className="flex gap-2 text-xs text-zinc-500">
          <span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-purple-400">
            LLM: {allTraces.filter(t => t.type === 'llm').length}
          </span>
          <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-blue-400">
            HTTP: {allTraces.filter(t => t.type === 'http').length}
          </span>
          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-400">
            Tool: {allTraces.filter(t => t.type === 'tool').length}
          </span>
          <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-green-400">
            Eval: {allTraces.filter(t => t.type === 'eval').length}
          </span>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[80px_1fr_120px_100px_80px_80px] gap-2 border-b border-zinc-800 px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-600">
        <span>Type</span>
        <span>Name</span>
        <span>Workflow</span>
        <span>Step</span>
        <span>Duration</span>
        <span>Status</span>
      </div>

      {/* Virtualized rows */}
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
                <div className={cn(
                  'grid grid-cols-[80px_1fr_120px_100px_80px_80px] gap-2 items-center px-4 py-2 text-xs border-b border-zinc-800/30 hover:bg-zinc-800/30 transition-colors',
                  trace.status === 'error' && 'bg-red-500/5',
                )}>
                  <span className={cn(
                    'rounded px-1.5 py-0.5 text-[10px] font-medium uppercase w-fit',
                    trace.type === 'llm' && 'bg-purple-500/10 text-purple-400',
                    trace.type === 'http' && 'bg-blue-500/10 text-blue-400',
                    trace.type === 'tool' && 'bg-amber-500/10 text-amber-400',
                    trace.type === 'eval' && 'bg-green-500/10 text-green-400',
                  )}>
                    {trace.type}
                  </span>
                  <span className="truncate text-zinc-300 font-mono text-[11px]">{trace.name}</span>
                  <span className="truncate text-zinc-500">{trace.workflowName}</span>
                  <span className="truncate text-zinc-500">{trace.stepName}</span>
                  <span className="font-mono text-zinc-400">{formatDuration(trace.duration)}</span>
                  <span className={cn(
                    'text-[10px] font-medium',
                    trace.status === 'success' ? 'text-emerald-400' : 'text-red-400'
                  )}>
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
