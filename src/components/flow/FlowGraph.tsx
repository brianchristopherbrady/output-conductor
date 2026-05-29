import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkflowExecution, StepExecution } from '@/types';
import { cn, formatDuration } from '@/utils';
import {
  CheckCircle2, XCircle, Loader2, Clock, RefreshCw,
  Database, X, ArrowLeft, Route,
} from 'lucide-react';

// --- Constants ---

const NODE_W = 200;
const NODE_H = 70;
const H_SPACING = 100;
const V_SPACING = 100;
const COLS = 5;

const STATUS_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  completed: { bg: 'var(--ds-status-success)', border: 'rgba(34,197,94,0.6)', glow: 'rgba(34,197,94,0.25)' },
  running: { bg: 'var(--ds-status-info)', border: 'rgba(59,130,246,0.6)', glow: 'rgba(59,130,246,0.35)' },
  failed: { bg: 'var(--ds-status-error)', border: 'rgba(239,68,68,0.6)', glow: 'rgba(239,68,68,0.25)' },
  cached: { bg: 'var(--ds-status-cached)', border: 'rgba(6,182,212,0.5)', glow: 'rgba(6,182,212,0.25)' },
  pending: { bg: 'var(--ds-text-muted)', border: 'rgba(113,113,122,0.3)', glow: 'rgba(113,113,122,0.1)' },
};

// --- Helpers ---

function getStatusIcon(status: StepExecution['status'], className: string) {
  switch (status) {
    case 'completed': return <CheckCircle2 className={className} />;
    case 'running': return <Loader2 className={cn(className, 'animate-spin')} />;
    case 'failed': return <XCircle className={className} />;
    case 'cached': return <Database className={className} />;
    case 'pending': return <Clock className={className} />;
  }
}

function edgeColor(status: string): string {
  switch (status) {
    case 'completed': return 'rgba(34,197,94,0.7)';
    case 'active': return 'rgba(59,130,246,0.8)';
    case 'failed': return 'rgba(239,68,68,0.7)';
    default: return 'rgba(113,113,122,0.25)';
  }
}

function computePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  if (from.y === to.y) {
    const x1 = from.x + NODE_W, y1 = from.y + NODE_H / 2;
    const x2 = to.x, y2 = to.y + NODE_H / 2;
    return `M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`;
  }
  const x1 = from.x + NODE_W / 2, y1 = from.y + NODE_H;
  const x2 = to.x + NODE_W / 2, y2 = to.y;
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}

// --- Particle system ---

interface Particle { id: string; edgeIdx: number; progress: number; speed: number; }

function useParticles(edgeCount: number, activeEdges: Set<number>) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    if (activeEdges.size === 0) { setParticles([]); return; }

    const initial: Particle[] = [];
    activeEdges.forEach(idx => {
      const count = 2;
      for (let i = 0; i < count; i++) {
        initial.push({ id: `${idx}_${i}`, edgeIdx: idx, progress: i / count, speed: 0.006 + Math.random() * 0.004 });
      }
    });
    setParticles(initial);

    function tick(t: number) {
      if (!lastRef.current) lastRef.current = t;
      const dt = Math.min((t - lastRef.current) / 16, 3);
      lastRef.current = t;
      setParticles(prev => prev.map(p => ({ ...p, progress: (p.progress + p.speed * dt) % 1 })));
      frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frameRef.current); lastRef.current = 0; };
  }, [edgeCount, activeEdges]);

  return particles;
}

function ParticleDot({ pathD, progress, color }: { pathD: string; progress: number; color: string }) {
  const pathEl = useMemo(() => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', pathD);
    return p;
  }, [pathD]);
  const len = pathEl.getTotalLength();
  const pt = pathEl.getPointAtLength(progress * len);
  return <circle cx={pt.x} cy={pt.y} r={3.5} fill={color} opacity={0.9} filter="url(#flowGlow)" />;
}

// --- Main Component ---

interface FlowGraphProps {
  executions: WorkflowExecution[];
  selectedExecution: WorkflowExecution | null;
  onSelectExecution: (ex: WorkflowExecution | null) => void;
}

export function FlowGraph({ executions, selectedExecution, onSelectExecution }: FlowGraphProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [activeRun, setActiveRun] = useState<WorkflowExecution | null>(null);
  const [inspectedStep, setInspectedStep] = useState<StepExecution | null>(null);

  // Group by workflow
  const workflows = useMemo(() => {
    const map = new Map<string, WorkflowExecution[]>();
    executions.forEach(ex => {
      const list = map.get(ex.workflowName) || [];
      list.push(ex);
      map.set(ex.workflowName, list);
    });
    return Array.from(map.entries())
      .map(([name, execs]) => ({ name, execs, count: execs.length }))
      .sort((a, b) => b.count - a.count);
  }, [executions]);

  const activeWorkflowName = selectedWorkflow || workflows[0]?.name || null;
  const workflowRuns = useMemo(
    () => executions.filter(e => e.workflowName === activeWorkflowName),
    [executions, activeWorkflowName]
  );

  // Get the step template from first execution of this workflow
  const stepTemplate = workflowRuns[0]?.steps.map(s => s.name) || [];

  // Node layout (always the same for the workflow)
  const cols = Math.min(stepTemplate.length, COLS);
  const nodes = stepTemplate.map((name, i) => ({
    name,
    x: (i % cols) * (NODE_W + H_SPACING) + 50,
    y: Math.floor(i / cols) * (NODE_H + V_SPACING) + 40,
  }));

  const svgW = Math.max(...nodes.map(n => n.x + NODE_W), 400) + 60;
  const svgH = Math.max(...nodes.map(n => n.y + NODE_H), 100) + 60;

  // If a run is selected, get its step statuses
  const runSteps = activeRun?.steps || null;

  // Compute edge states
  const edgePaths = nodes.slice(0, -1).map((from, i) => ({
    path: computePath(from, nodes[i + 1]),
    fromIdx: i,
  }));

  const edgeStatuses = edgePaths.map((_, i) => {
    if (!runSteps) return 'neutral';
    const from = runSteps[i];
    const to = runSteps[i + 1];
    if (!from || !to) return 'neutral';
    if (from.status === 'completed' || from.status === 'cached') {
      if (to.status === 'failed') return 'failed';
      if (to.status === 'running') return 'active';
      if (to.status === 'completed' || to.status === 'cached') return 'completed';
    }
    if (from.status === 'running') return 'active';
    return 'neutral';
  });

  const activeEdgeSet = useMemo(
    () => new Set(edgeStatuses.map((s, i) => s === 'active' || s === 'completed' ? i : -1).filter(i => i >= 0)),
    [edgeStatuses]
  );
  const particles = useParticles(edgePaths.length, activeEdgeSet);

  function selectRun(ex: WorkflowExecution) {
    setActiveRun(ex);
    setInspectedStep(null);
  }

  function clearRun() {
    setActiveRun(null);
    setInspectedStep(null);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-2"
        style={{ borderColor: 'var(--ds-border-secondary)', backgroundColor: 'var(--ds-bg-secondary)' }}
      >
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4" style={{ color: 'var(--ds-text-muted)' }} />
          <h2 className="text-xs font-bold" style={{ color: 'var(--ds-text-primary)' }}>Pipeline Flow</h2>
          {activeRun ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: STATUS_COLORS[activeRun.status]?.glow, color: STATUS_COLORS[activeRun.status]?.bg }}>
              Viewing run {activeRun.id.slice(3, 11)} — {activeRun.status}
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ color: 'var(--ds-text-muted)', backgroundColor: 'var(--ds-bg-tertiary)' }}>
              Workflow template — select a run below to see execution state
            </span>
          )}
        </div>
        {activeRun && (
          <button onClick={clearRun}
            className="flex items-center gap-1 text-[10px] rounded-md px-2 py-1 hover:bg-white/5 transition-all"
            style={{ color: 'var(--ds-text-muted)' }}>
            <X className="h-3 w-3" /> Clear selection
          </button>
        )}
      </div>

      {/* Workflow selector */}
      <div className="flex items-center gap-2 border-b px-4 py-1.5 overflow-x-auto"
        style={{ borderColor: 'var(--ds-border-secondary)' }}>
        {workflows.map(wf => (
          <button key={wf.name} onClick={() => { setSelectedWorkflow(wf.name); clearRun(); }}
            className={cn(
              'rounded-md px-2 py-1 text-[11px] font-medium transition-all whitespace-nowrap',
              activeWorkflowName === wf.name
                ? 'bg-conductor-500/20 text-conductor-300 ring-1 ring-conductor-500/30'
                : 'hover:bg-white/5',
            )}
            style={{ color: activeWorkflowName === wf.name ? undefined : 'var(--ds-text-tertiary)' }}>
            {wf.name.replace(/_/g, ' ')}
            <span className="ml-1 opacity-50">{wf.count}</span>
          </button>
        ))}
      </div>

      {/* Scrollable content: graph on top, table below */}
      <div className="flex-1 overflow-auto">
        <div className="flex overflow-hidden">
          {/* Flow diagram */}
          <div className="min-w-0 flex-1 overflow-x-auto p-5">
            <svg width={svgW} height={svgH} className="select-none mx-auto block">
              <defs>
                <filter id="flowGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Edges */}
              {edgePaths.map((edge, i) => {
                const status = edgeStatuses[i];
                const color = status === 'neutral' ? 'rgba(113,113,122,0.2)' : edgeColor(status);
                const width = status === 'active' ? 3 : status === 'neutral' ? 1.5 : 2;
                return (
                  <g key={i}>
                    {status !== 'neutral' && (
                      <path d={edge.path} fill="none" stroke={color} strokeWidth={width + 4}
                        strokeLinecap="round" opacity={0.2} filter="url(#flowGlow)" />
                    )}
                    <path d={edge.path} fill="none" stroke={color} strokeWidth={width}
                      strokeLinecap="round" strokeDasharray={status === 'neutral' ? '6 4' : undefined} />
                  </g>
                );
              })}

              {/* Particles */}
              {particles.map(p => {
                const edge = edgePaths[p.edgeIdx];
                if (!edge) return null;
                const status = edgeStatuses[p.edgeIdx];
                return <ParticleDot key={p.id} pathD={edge.path} progress={p.progress} color={edgeColor(status)} />;
              })}

              {/* Nodes */}
              {nodes.map((node, i) => {
                const step = runSteps?.[i];
                const hasState = !!step;
                const status = step?.status || 'neutral';
                const colors = STATUS_COLORS[status];
                const isInspected = inspectedStep && runSteps && inspectedStep.id === runSteps[i]?.id;

                return (
                  <g key={node.name}
                    onClick={() => { if (step) setInspectedStep(isInspected ? null : step); }}
                    className={step ? 'cursor-pointer' : 'cursor-default'}>
                    {/* Glow for active states */}
                    {hasState && (status === 'running' || isInspected) && (
                      <rect x={node.x - 4} y={node.y - 4} width={NODE_W + 8} height={NODE_H + 8}
                        rx={14} fill={colors?.glow || 'transparent'} filter="url(#flowGlow)" opacity={0.5} />
                    )}
                    {/* Card */}
                    <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx={10}
                      fill="var(--ds-bg-tertiary)"
                      stroke={hasState ? (isInspected ? colors?.bg : colors?.border) : 'var(--ds-border-primary)'}
                      strokeWidth={isInspected ? 2.5 : hasState ? 1.5 : 1} />
                    {/* Left accent */}
                    {hasState && (
                      <rect x={node.x} y={node.y + 10} width={4} height={NODE_H - 20} rx={2}
                        fill={colors?.bg || 'var(--ds-text-muted)'} />
                    )}
                    {/* Step name */}
                    <text x={node.x + (hasState ? 16 : 12)} y={node.y + 26} fontSize={12} fontWeight={600}
                      fill="var(--ds-text-primary)" fontFamily="inherit">
                      {node.name}
                    </text>
                    {/* Status info or step number */}
                    {hasState ? (
                      <text x={node.x + 16} y={node.y + 46} fontSize={10}
                        fill="var(--ds-text-muted)" fontFamily="inherit">
                        {status}{step?.duration ? ` · ${formatDuration(step.duration)}` : ''}
                        {step?.cached ? ' ⚡' : ''}
                      </text>
                    ) : (
                      <text x={node.x + 12} y={node.y + 46} fontSize={10}
                        fill="var(--ds-text-muted)" fontFamily="inherit" opacity={0.6}>
                        Step {i + 1}
                      </text>
                    )}
                    {/* Retry badge */}
                    {step && step.retryCount > 0 && (
                      <>
                        <circle cx={node.x + NODE_W - 18} cy={node.y + 16} r={10}
                          fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.4)" strokeWidth={0.5} />
                        <text x={node.x + NODE_W - 18} y={node.y + 20} fontSize={9}
                          fill="var(--ds-status-error)" textAnchor="middle" fontWeight={700} fontFamily="inherit">
                          {step.retryCount}×
                        </text>
                      </>
                    )}
                    {/* Step number badge (template mode) */}
                    {!hasState && (
                      <>
                        <circle cx={node.x + NODE_W - 16} cy={node.y + 16} r={9}
                          fill="var(--ds-bg-app)" stroke="var(--ds-border-primary)" strokeWidth={0.5} />
                        <text x={node.x + NODE_W - 16} y={node.y + 20} fontSize={9}
                          fill="var(--ds-text-muted)" textAnchor="middle" fontWeight={600} fontFamily="inherit">
                          {i + 1}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Step inspector (when a node is clicked in active run) */}
          <AnimatePresence>
            {inspectedStep && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="overflow-y-auto border-l flex-shrink-0"
                style={{ borderColor: 'var(--ds-border-secondary)', backgroundColor: 'var(--ds-bg-secondary)' }}
              >
                <StepInspector step={inspectedStep} onClose={() => setInspectedStep(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Full-width execution table */}
        <div className="border-t" style={{ borderColor: 'var(--ds-border-secondary)' }}>
          <div className="px-4 py-2.5 flex items-center justify-between"
            style={{ backgroundColor: 'var(--ds-bg-secondary)' }}>
            <h3 className="text-[11px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
              Execution History
              <span className="ml-2 font-normal" style={{ color: 'var(--ds-text-muted)' }}>
                ({workflowRuns.length} runs)
              </span>
            </h3>
            <p className="text-[10px]" style={{ color: 'var(--ds-text-muted)' }}>
              Click a row to visualize its execution state in the flow above
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--ds-border-secondary)', backgroundColor: 'var(--ds-bg-tertiary)' }}>
                  <th className="text-left px-4 py-2 font-medium text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--ds-text-muted)' }}>Status</th>
                  <th className="text-left px-4 py-2 font-medium text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--ds-text-muted)' }}>Run ID</th>
                  <th className="text-left px-4 py-2 font-medium text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--ds-text-muted)' }}>Progress</th>
                  <th className="text-left px-4 py-2 font-medium text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--ds-text-muted)' }}>Duration</th>
                  <th className="text-left px-4 py-2 font-medium text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--ds-text-muted)' }}>Model</th>
                  <th className="text-left px-4 py-2 font-medium text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--ds-text-muted)' }}>Cost</th>
                  <th className="text-left px-4 py-2 font-medium text-[10px] uppercase tracking-wider"
                    style={{ color: 'var(--ds-text-muted)' }}>Blocked At</th>
                </tr>
              </thead>
              <tbody>
                {workflowRuns.slice(0, 50).map(ex => {
                  const isActive = activeRun?.id === ex.id;
                  const done = ex.steps.filter(s => s.status === 'completed' || s.status === 'cached').length;
                  const failedStep = ex.steps.find(s => s.status === 'failed');
                  return (
                    <tr
                      key={ex.id}
                      onClick={() => selectRun(ex)}
                      className={cn(
                        'border-b cursor-pointer transition-colors',
                        isActive ? 'ring-1 ring-inset ring-conductor-500/30' : 'hover:bg-white/[0.02]',
                      )}
                      style={{
                        borderColor: 'var(--ds-border-secondary)',
                        backgroundColor: isActive ? 'var(--ds-bg-tertiary)' : undefined,
                      }}
                    >
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[ex.status]?.bg }} />
                          <span className="capitalize font-medium" style={{ color: STATUS_COLORS[ex.status]?.bg }}>
                            {ex.status}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: 'var(--ds-text-tertiary)' }}>
                        {ex.id}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ds-bg-app)' }}>
                            <div className="h-full rounded-full" style={{
                              width: `${(done / ex.steps.length) * 100}%`,
                              backgroundColor: failedStep ? 'var(--ds-status-error)' : 'var(--ds-status-success)',
                            }} />
                          </div>
                          <span className="text-[10px]" style={{ color: 'var(--ds-text-muted)' }}>
                            {done}/{ex.steps.length}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--ds-text-muted)' }}>
                        {formatDuration(ex.duration || 0)}
                      </td>
                      <td className="px-4 py-2.5 text-[10px]" style={{ color: 'var(--ds-text-muted)' }}>
                        {ex.model}
                      </td>
                      <td className="px-4 py-2.5" style={{ color: 'var(--ds-text-muted)' }}>
                        ${ex.totalCost.toFixed(4)}
                      </td>
                      <td className="px-4 py-2.5">
                        {failedStep ? (
                          <span className="text-[10px] font-medium" style={{ color: 'var(--ds-status-error)' }}>
                            {failedStep.name}
                          </span>
                        ) : (
                          <span className="text-[10px]" style={{ color: 'var(--ds-text-muted)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Step Inspector Sidebar ---

function StepInspector({ step, onClose }: { step: StepExecution; onClose: () => void }) {
  const colors = STATUS_COLORS[step.status] || STATUS_COLORS.pending;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: 'var(--ds-text-primary)' }}>{step.name}</h3>
        <button onClick={onClose} className="rounded p-1 hover:bg-white/10" style={{ color: 'var(--ds-text-muted)' }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {getStatusIcon(step.status, 'h-4 w-4')}
        <span className="text-xs font-medium capitalize" style={{ color: colors.bg }}>{step.status}</span>
        {step.duration && (
          <span className="text-[10px] ml-auto" style={{ color: 'var(--ds-text-muted)' }}>{formatDuration(step.duration)}</span>
        )}
      </div>

      {step.retryCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
          <RefreshCw className="h-3.5 w-3.5" style={{ color: 'var(--ds-status-error)' }} />
          <span className="text-xs" style={{ color: 'var(--ds-status-error)' }}>Retried {step.retryCount}×</span>
        </div>
      )}

      <div>
        <h4 className="text-[10px] uppercase tracking-wider font-medium mb-2" style={{ color: 'var(--ds-text-muted)' }}>
          Traces ({step.traces.length})
        </h4>
        <div className="space-y-1">
          {step.traces.map(trace => (
            <div key={trace.id} className="rounded-lg p-2 text-xs flex items-center gap-2"
              style={{ backgroundColor: 'var(--ds-bg-tertiary)' }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: trace.status === 'success' ? 'var(--ds-status-success)' : 'var(--ds-status-error)' }} />
              <span className="truncate flex-1" style={{ color: 'var(--ds-text-secondary)' }}>{trace.name}</span>
              <span className="text-[10px]" style={{ color: 'var(--ds-text-muted)' }}>{trace.duration}ms</span>
            </div>
          ))}
        </div>
      </div>

      {step.evaluations && step.evaluations.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider font-medium mb-2" style={{ color: 'var(--ds-text-muted)' }}>
            Evaluations
          </h4>
          <div className="space-y-1.5">
            {step.evaluations.map(ev => (
              <div key={ev.id} className="rounded-lg p-2.5 text-xs" style={{ backgroundColor: 'var(--ds-bg-tertiary)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium" style={{ color: 'var(--ds-text-secondary)' }}>{ev.evaluatorName}</span>
                  <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                    ev.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400',
                  )}>
                    {ev.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--ds-text-muted)' }}>{ev.reasoning}</p>
                {ev.score != null && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ds-bg-app)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${ev.score * 100}%`,
                        backgroundColor: ev.score > 0.7 ? 'var(--ds-status-success)' : ev.score > 0.4 ? 'var(--ds-status-warning)' : 'var(--ds-status-error)',
                      }} />
                    </div>
                    <span className="text-[9px]" style={{ color: 'var(--ds-text-muted)' }}>{(ev.score * 100).toFixed(0)}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
