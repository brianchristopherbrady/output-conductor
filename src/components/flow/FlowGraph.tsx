import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkflowExecution, StepExecution } from '@/types';
import { cn, formatDuration } from '@/utils';
import {
  CheckCircle2, XCircle, Loader2, Clock, RefreshCw,
  Database, X, ChevronRight, ArrowLeft, Route, Info,
} from 'lucide-react';

// --- Types ---

interface FlowNode {
  id: string;
  step: StepExecution;
  x: number;
  y: number;
}

interface FlowEdge {
  id: string;
  from: FlowNode;
  to: FlowNode;
  status: 'active' | 'completed' | 'failed' | 'pending';
}

interface Particle {
  id: string;
  edgeId: string;
  progress: number;
  speed: number;
}

// --- Constants ---

const NODE_W = 200;
const NODE_H = 70;
const H_SPACING = 100;
const V_SPACING = 100;
const COLS = 4;

const STATUS_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  completed: { bg: 'var(--ds-status-success)', border: 'rgba(34,197,94,0.5)', glow: 'rgba(34,197,94,0.25)' },
  running: { bg: 'var(--ds-status-info)', border: 'rgba(59,130,246,0.6)', glow: 'rgba(59,130,246,0.35)' },
  failed: { bg: 'var(--ds-status-error)', border: 'rgba(239,68,68,0.5)', glow: 'rgba(239,68,68,0.25)' },
  cached: { bg: 'var(--ds-status-cached)', border: 'rgba(6,182,212,0.5)', glow: 'rgba(6,182,212,0.25)' },
  pending: { bg: 'var(--ds-text-muted)', border: 'rgba(113,113,122,0.3)', glow: 'rgba(113,113,122,0.1)' },
};

function getStatusIcon(status: StepExecution['status'], className: string) {
  switch (status) {
    case 'completed': return <CheckCircle2 className={className} />;
    case 'running': return <Loader2 className={cn(className, 'animate-spin')} />;
    case 'failed': return <XCircle className={className} />;
    case 'cached': return <Database className={className} />;
    case 'pending': return <Clock className={className} />;
  }
}

// --- Layout ---

function layoutSteps(steps: StepExecution[]): FlowNode[] {
  return steps.map((step, i) => ({
    id: step.id,
    step,
    x: (i % COLS) * (NODE_W + H_SPACING) + 50,
    y: Math.floor(i / COLS) * (NODE_H + V_SPACING) + 50,
  }));
}

function buildEdges(nodes: FlowNode[]): FlowEdge[] {
  return nodes.slice(0, -1).map((from, i) => {
    const to = nodes[i + 1];
    let status: FlowEdge['status'] = 'pending';
    if (from.step.status === 'completed' || from.step.status === 'cached') {
      status = to.step.status === 'failed' ? 'failed' : to.step.status === 'running' ? 'active' : 'completed';
    } else if (from.step.status === 'running') {
      status = 'active';
    }
    return { id: `${from.id}->${to.id}`, from, to, status };
  });
}

function edgePath(from: FlowNode, to: FlowNode): string {
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

function edgeColor(status: FlowEdge['status']): string {
  switch (status) {
    case 'completed': return 'rgba(34,197,94,0.6)';
    case 'active': return 'rgba(59,130,246,0.8)';
    case 'failed': return 'rgba(239,68,68,0.6)';
    case 'pending': return 'rgba(113,113,122,0.25)';
  }
}

// --- Particle System ---

function useParticles(edges: FlowEdge[]) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    const active = edges.filter(e => e.status === 'active' || e.status === 'completed');
    if (!active.length) { setParticles([]); return; }

    const initial: Particle[] = active.flatMap(edge =>
      Array.from({ length: edge.status === 'active' ? 3 : 1 }, (_, i) => ({
        id: `${edge.id}_p${i}`,
        edgeId: edge.id,
        progress: i / (edge.status === 'active' ? 3 : 1),
        speed: edge.status === 'active' ? 0.008 + Math.random() * 0.004 : 0.003,
      }))
    );
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
  }, [edges]);

  return particles;
}

// --- Particle Renderer ---

function ParticleDot({ pathD, progress, color }: { pathD: string; progress: number; color: string }) {
  const pathEl = useMemo(() => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', pathD);
    return p;
  }, [pathD]);

  const len = pathEl.getTotalLength();
  const pt = pathEl.getPointAtLength(progress * len);

  return <circle cx={pt.x} cy={pt.y} r={3} fill={color} opacity={0.85} filter="url(#glow)" />;
}

// --- Main Component ---

interface FlowGraphProps {
  executions: WorkflowExecution[];
  selectedExecution: WorkflowExecution | null;
  onSelectExecution: (ex: WorkflowExecution | null) => void;
}

export function FlowGraph({ executions, selectedExecution, onSelectExecution }: FlowGraphProps) {
  // Self-managed internal state for which execution is being viewed in detail
  const [internalExecution, setInternalExecution] = useState<WorkflowExecution | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [inspectedStep, setInspectedStep] = useState<StepExecution | null>(null);

  // Use either the externally selected execution or the internal one
  const activeExecution = selectedExecution || internalExecution;

  const aggregates = useMemo(() => {
    const byWorkflow = new Map<string, WorkflowExecution[]>();
    executions.forEach(ex => {
      const list = byWorkflow.get(ex.workflowName) || [];
      list.push(ex);
      byWorkflow.set(ex.workflowName, list);
    });
    return Array.from(byWorkflow.entries())
      .map(([name, execs]) => ({ name, execs, count: execs.length }))
      .sort((a, b) => b.count - a.count);
  }, [executions]);

  const activeWorkflowName = selectedWorkflow || aggregates[0]?.name || null;
  const workflowExecutions = useMemo(
    () => executions.filter(e => e.workflowName === activeWorkflowName),
    [executions, activeWorkflowName]
  );

  function selectExecution(ex: WorkflowExecution) {
    setInternalExecution(ex);
    onSelectExecution(ex);
    setInspectedStep(null);
  }

  function goBack() {
    setInternalExecution(null);
    onSelectExecution(null);
    setInspectedStep(null);
  }

  // --- DETAIL MODE ---
  if (activeExecution) {
    return (
      <DetailView
        execution={activeExecution}
        inspectedStep={inspectedStep}
        setInspectedStep={setInspectedStep}
        onBack={goBack}
      />
    );
  }

  // --- AGGREGATE MODE ---
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: 'var(--ds-border-secondary)', backgroundColor: 'var(--ds-bg-secondary)' }}
      >
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4" style={{ color: 'var(--ds-text-muted)' }} />
          <h2 className="text-xs font-bold" style={{ color: 'var(--ds-text-primary)' }}>
            Pipeline Flow
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: 'var(--ds-text-muted)', backgroundColor: 'var(--ds-bg-tertiary)' }}>
            Aggregate view — step health across all runs
          </span>
        </div>
      </div>

      {/* Workflow tabs */}
      <div
        className="flex items-center gap-2 border-b px-4 py-2 overflow-x-auto"
        style={{ borderColor: 'var(--ds-border-secondary)' }}
      >
        {aggregates.map(agg => (
          <button
            key={agg.name}
            onClick={() => setSelectedWorkflow(agg.name)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap',
              activeWorkflowName === agg.name
                ? 'bg-conductor-500/20 text-conductor-300 ring-1 ring-conductor-500/30'
                : 'hover:bg-white/5',
            )}
            style={{ color: activeWorkflowName === agg.name ? undefined : 'var(--ds-text-tertiary)' }}
          >
            {agg.name.replace(/_/g, ' ')}
            <span className="ml-1.5 opacity-50">{agg.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Aggregate graph */}
        <div className="flex-1 overflow-auto p-6">
          {activeWorkflowName && (
            <AggregateGraph
              executions={workflowExecutions}
              onSelectExecution={selectExecution}
            />
          )}
        </div>

        {/* Execution list sidebar */}
        <div
          className="w-64 flex flex-col overflow-hidden border-l"
          style={{ borderColor: 'var(--ds-border-secondary)', backgroundColor: 'var(--ds-bg-secondary)' }}
        >
          <div className="px-3 py-2.5 border-b" style={{ borderColor: 'var(--ds-border-secondary)' }}>
            <h3 className="text-[11px] font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
              Recent Executions
            </h3>
            <p className="text-[9px] mt-0.5" style={{ color: 'var(--ds-text-muted)' }}>
              Select one to see its step-by-step flow
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {workflowExecutions.slice(0, 40).map(ex => {
              const done = ex.steps.filter(s => s.status === 'completed' || s.status === 'cached').length;
              const failed = ex.steps.some(s => s.status === 'failed');
              return (
                <button
                  key={ex.id}
                  onClick={() => selectExecution(ex)}
                  className="w-full rounded-lg px-2.5 py-2 text-left transition-all hover:bg-white/5 flex items-center gap-2 group"
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[ex.status]?.bg }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium truncate" style={{ color: 'var(--ds-text-secondary)' }}>
                      {done}/{ex.steps.length} steps passed
                      {failed && <span className="ml-1 text-red-400">✕</span>}
                    </p>
                    <p className="text-[9px]" style={{ color: 'var(--ds-text-muted)' }}>
                      {formatDuration(ex.duration || 0)} • {ex.id.slice(3, 11)}
                    </p>
                  </div>
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--ds-text-muted)' }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Aggregate Graph (step health across runs) ---

function AggregateGraph({
  executions,
  onSelectExecution,
}: {
  executions: WorkflowExecution[];
  onSelectExecution: (ex: WorkflowExecution) => void;
}) {
  if (!executions.length) return null;
  const stepNames = executions[0].steps.map(s => s.name);

  // Compute stats per step
  const stepData = stepNames.map((name, i) => {
    const allSteps = executions.map(ex => ex.steps[i]).filter(Boolean);
    const total = allSteps.length;
    const completed = allSteps.filter(s => s.status === 'completed').length;
    const failed = allSteps.filter(s => s.status === 'failed').length;
    const cached = allSteps.filter(s => s.status === 'cached').length;
    const avgDuration = allSteps.reduce((s, st) => s + (st.duration || 0), 0) / total;
    return { name, total, completed, failed, cached, avgDuration, successRate: (completed + cached) / total, failRate: failed / total };
  });

  // Layout
  const nodes = stepData.map((d, i) => ({
    ...d,
    x: (i % COLS) * (NODE_W + H_SPACING) + 40,
    y: Math.floor(i / COLS) * (NODE_H + V_SPACING) + 40,
  }));

  const svgW = Math.max(...nodes.map(n => n.x + NODE_W)) + 60;
  const svgH = Math.max(...nodes.map(n => n.y + NODE_H)) + 60;

  // Edges
  const edges = nodes.slice(0, -1).map((from, i) => {
    const to = nodes[i + 1];
    return { from, to, throughput: from.successRate };
  });

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-green-500" />
          <span className="text-[10px]" style={{ color: 'var(--ds-text-muted)' }}>Passed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-red-500" />
          <span className="text-[10px]" style={{ color: 'var(--ds-text-muted)' }}>Failed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-cyan-500" />
          <span className="text-[10px]" style={{ color: 'var(--ds-text-muted)' }}>Cached</span>
        </div>
        <span className="text-[10px] ml-auto" style={{ color: 'var(--ds-text-muted)' }}>
          Edge thickness = throughput rate
        </span>
      </div>

      <svg width={svgW} height={svgH} className="select-none">
        <defs>
          <filter id="aggGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const path = computePath(e.from, e.to);
          const w = 1.5 + e.throughput * 3;
          const opacity = 0.3 + e.throughput * 0.5;
          return (
            <g key={i}>
              <path d={path} fill="none" stroke={`rgba(34,197,94,${opacity * 0.3})`} strokeWidth={w + 4} strokeLinecap="round" filter="url(#aggGlow)" />
              <path d={path} fill="none" stroke={`rgba(34,197,94,${opacity})`} strokeWidth={w} strokeLinecap="round" />
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const barW = NODE_W - 24;
          return (
            <g key={node.name} className="cursor-default">
              {/* Card bg */}
              <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx={10}
                fill="var(--ds-bg-tertiary)" stroke="var(--ds-border-primary)" strokeWidth={1} />
              {/* Left accent */}
              <rect x={node.x} y={node.y + 8} width={3} height={NODE_H - 16} rx={1.5}
                fill={node.failRate > 0.2 ? 'var(--ds-status-error)' : 'var(--ds-status-success)'} />
              {/* Step name */}
              <text x={node.x + 14} y={node.y + 20} fontSize={11} fontWeight={600}
                fill="var(--ds-text-primary)" fontFamily="inherit">
                {node.name}
              </text>
              {/* Stats */}
              <text x={node.x + 14} y={node.y + 36} fontSize={10} fill="var(--ds-text-muted)" fontFamily="inherit">
                {(node.successRate * 100).toFixed(0)}% pass · ~{formatDuration(node.avgDuration)}
              </text>
              {/* Bar */}
              <rect x={node.x + 12} y={node.y + 48} width={barW} height={5} rx={2.5}
                fill="var(--ds-text-muted)" opacity={0.1} />
              <rect x={node.x + 12} y={node.y + 48} width={barW * node.successRate} height={5} rx={2.5}
                fill="var(--ds-status-success)" opacity={0.8} />
              {node.failRate > 0 && (
                <rect x={node.x + 12 + barW * node.successRate} y={node.y + 48}
                  width={barW * node.failRate} height={5} rx={2.5} fill="var(--ds-status-error)" opacity={0.8} />
              )}
              {/* Step number */}
              <circle cx={node.x + NODE_W - 16} cy={node.y + 16} r={9}
                fill="var(--ds-bg-app)" stroke="var(--ds-border-primary)" strokeWidth={0.5} />
              <text x={node.x + NODE_W - 16} y={node.y + 20} fontSize={9} fill="var(--ds-text-muted)"
                textAnchor="middle" fontWeight={600} fontFamily="inherit">{i + 1}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
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

// --- Detail View (single execution flow) ---

function DetailView({
  execution,
  inspectedStep,
  setInspectedStep,
  onBack,
}: {
  execution: WorkflowExecution;
  inspectedStep: StepExecution | null;
  setInspectedStep: (s: StepExecution | null) => void;
  onBack: () => void;
}) {
  const nodes = useMemo(() => layoutSteps(execution.steps), [execution.steps]);
  const edges = useMemo(() => buildEdges(nodes), [nodes]);
  const particles = useParticles(edges);

  const svgW = Math.max(...nodes.map(n => n.x + NODE_W)) + 80;
  const svgH = Math.max(...nodes.map(n => n.y + NODE_H)) + 80;

  const completedSteps = execution.steps.filter(s => s.status === 'completed' || s.status === 'cached').length;
  const failedStep = execution.steps.find(s => s.status === 'failed');

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: 'var(--ds-border-secondary)', backgroundColor: 'var(--ds-bg-secondary)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all hover:bg-white/5"
            style={{ color: 'var(--ds-text-muted)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="h-4 w-px" style={{ backgroundColor: 'var(--ds-border-primary)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--ds-text-primary)' }}>
            {execution.workflowName.replace(/_/g, ' ')}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              backgroundColor: STATUS_COLORS[execution.status]?.glow,
              color: STATUS_COLORS[execution.status]?.bg,
            }}
          >
            {execution.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--ds-text-muted)' }}>
          <span>{completedSteps}/{execution.steps.length} steps done</span>
          {failedStep && (
            <span className="text-red-400">⚠ Blocked at: {failedStep.name}</span>
          )}
          <span>{formatDuration(execution.duration || 0)}</span>
        </div>
      </div>

      {/* Graph + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* SVG canvas */}
        <div className="flex-1 overflow-auto p-6">
          <p className="text-[10px] mb-4" style={{ color: 'var(--ds-text-muted)' }}>
            Click any step node to inspect its traces and evaluations →
          </p>
          <svg width={svgW} height={svgH} className="select-none">
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Edges */}
            {edges.map(edge => {
              const d = edgePath(edge.from, edge.to);
              const color = edgeColor(edge.status);
              return (
                <g key={edge.id}>
                  <path d={d} fill="none" stroke={color} strokeWidth={edge.status === 'active' ? 3 : 2}
                    strokeLinecap="round" opacity={0.3} filter="url(#glow)" />
                  <path d={d} fill="none" stroke={color} strokeWidth={edge.status === 'active' ? 2.5 : 1.5}
                    strokeLinecap="round" strokeDasharray={edge.status === 'pending' ? '4 4' : undefined} />
                </g>
              );
            })}

            {/* Particles */}
            {particles.map(p => {
              const edge = edges.find(e => e.id === p.edgeId);
              if (!edge) return null;
              return <ParticleDot key={p.id} pathD={edgePath(edge.from, edge.to)} progress={p.progress} color={edgeColor(edge.status)} />;
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const colors = STATUS_COLORS[node.step.status] || STATUS_COLORS.pending;
              const isInspected = inspectedStep?.id === node.id;

              return (
                <g
                  key={node.id}
                  onClick={() => setInspectedStep(isInspected ? null : node.step)}
                  className="cursor-pointer"
                >
                  {/* Glow for running/selected */}
                  {(node.step.status === 'running' || isInspected) && (
                    <rect x={node.x - 4} y={node.y - 4} width={NODE_W + 8} height={NODE_H + 8}
                      rx={14} fill={colors.glow} filter="url(#nodeGlow)" opacity={0.5} />
                  )}
                  {/* Card */}
                  <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx={10}
                    fill="var(--ds-bg-tertiary)" stroke={isInspected ? colors.bg : colors.border}
                    strokeWidth={isInspected ? 2.5 : 1} />
                  {/* Left status bar */}
                  <rect x={node.x} y={node.y + 10} width={4} height={NODE_H - 20} rx={2} fill={colors.bg} />
                  {/* Name */}
                  <text x={node.x + 16} y={node.y + 26} fontSize={12} fontWeight={600}
                    fill="var(--ds-text-primary)" fontFamily="inherit">
                    {node.step.name}
                  </text>
                  {/* Status + duration */}
                  <text x={node.x + 16} y={node.y + 46} fontSize={10} fill="var(--ds-text-muted)" fontFamily="inherit">
                    {node.step.status}{node.step.duration ? ` · ${formatDuration(node.step.duration)}` : ''}
                    {node.step.cached ? ' ⚡' : ''}
                  </text>
                  {/* Retry badge */}
                  {node.step.retryCount > 0 && (
                    <>
                      <circle cx={node.x + NODE_W - 18} cy={node.y + 16} r={10}
                        fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.4)" strokeWidth={0.5} />
                      <text x={node.x + NODE_W - 18} y={node.y + 20} fontSize={9}
                        fill="var(--ds-status-error)" textAnchor="middle" fontWeight={700} fontFamily="inherit">
                        {node.step.retryCount}×
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Step inspector sidebar */}
        <AnimatePresence>
          {inspectedStep && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="overflow-y-auto border-l flex-shrink-0"
              style={{ borderColor: 'var(--ds-border-secondary)', backgroundColor: 'var(--ds-bg-secondary)' }}
            >
              <StepInspector step={inspectedStep} onClose={() => setInspectedStep(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Step Inspector ---

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

      {/* Status row */}
      <div className="flex items-center gap-2">
        {getStatusIcon(step.status, 'h-4 w-4')}
        <span className="text-xs font-medium capitalize" style={{ color: colors.bg }}>{step.status}</span>
        {step.duration && (
          <span className="text-[10px] ml-auto" style={{ color: 'var(--ds-text-muted)' }}>{formatDuration(step.duration)}</span>
        )}
      </div>

      {/* Retries */}
      {step.retryCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
          <RefreshCw className="h-3.5 w-3.5" style={{ color: 'var(--ds-status-error)' }} />
          <span className="text-xs" style={{ color: 'var(--ds-status-error)' }}>
            Retried {step.retryCount}×
          </span>
        </div>
      )}

      {/* Traces */}
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

      {/* Evaluations */}
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
