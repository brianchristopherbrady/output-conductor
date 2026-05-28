import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkflowExecution, StepExecution } from '@/types';
import { cn, formatDuration } from '@/utils';
import {
  CheckCircle2, XCircle, Loader2, Zap, Clock, RefreshCw,
  Database, ArrowRight, X, AlertTriangle, ChevronRight,
} from 'lucide-react';

// --- Types ---

interface FlowNode {
  id: string;
  step: StepExecution;
  x: number;
  y: number;
  col: number;
  row: number;
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

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;
const H_GAP = 80;
const V_GAP = 40;

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  completed: { bg: 'var(--ds-status-success)', border: 'rgba(34,197,94,0.5)', text: '#fff', glow: 'rgba(34,197,94,0.3)' },
  running: { bg: 'var(--ds-status-info)', border: 'rgba(59,130,246,0.5)', text: '#fff', glow: 'rgba(59,130,246,0.4)' },
  failed: { bg: 'var(--ds-status-error)', border: 'rgba(239,68,68,0.5)', text: '#fff', glow: 'rgba(239,68,68,0.3)' },
  cached: { bg: 'var(--ds-status-cached)', border: 'rgba(168,85,247,0.5)', text: '#fff', glow: 'rgba(168,85,247,0.3)' },
  pending: { bg: 'var(--ds-text-muted)', border: 'rgba(113,113,122,0.4)', text: '#a1a1aa', glow: 'rgba(113,113,122,0.15)' },
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

function layoutNodes(steps: StepExecution[]): FlowNode[] {
  // Simple linear layout with wrapping at 4 nodes per row
  const COLS = 4;
  return steps.map((step, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return {
      id: step.id,
      step,
      col,
      row,
      x: col * (NODE_WIDTH + H_GAP) + 40,
      y: row * (NODE_HEIGHT + V_GAP + 40) + 40,
    };
  });
}

function buildEdges(nodes: FlowNode[]): FlowEdge[] {
  const edges: FlowEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const from = nodes[i];
    const to = nodes[i + 1];
    const status = from.step.status === 'completed' || from.step.status === 'cached'
      ? (to.step.status === 'failed' ? 'failed' : to.step.status === 'running' ? 'active' : 'completed')
      : from.step.status === 'running' ? 'active' : 'pending';
    edges.push({ id: `${from.id}->${to.id}`, from, to, status });
  }
  return edges;
}

// --- Edge Path Computation ---

function computeEdgePath(from: FlowNode, to: FlowNode): string {
  const COLS = 4;
  // Same row: straight arrow right
  if (from.row === to.row) {
    const x1 = from.x + NODE_WIDTH;
    const y1 = from.y + NODE_HEIGHT / 2;
    const x2 = to.x;
    const y2 = to.y + NODE_HEIGHT / 2;
    const cx1 = x1 + (x2 - x1) * 0.4;
    const cx2 = x1 + (x2 - x1) * 0.6;
    return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
  }
  // Different row: curve down to next row
  const x1 = from.x + NODE_WIDTH / 2;
  const y1 = from.y + NODE_HEIGHT;
  const x2 = to.x + NODE_WIDTH / 2;
  const y2 = to.y;
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}

// --- Edge Color ---

function edgeColor(status: FlowEdge['status']): string {
  switch (status) {
    case 'completed': return 'rgba(34,197,94,0.6)';
    case 'active': return 'rgba(59,130,246,0.8)';
    case 'failed': return 'rgba(239,68,68,0.6)';
    case 'pending': return 'rgba(113,113,122,0.3)';
  }
}

// --- Particle System ---

function useParticles(edges: FlowEdge[]) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    // Only animate active edges
    const activeEdges = edges.filter(e => e.status === 'active' || e.status === 'completed');
    if (activeEdges.length === 0) {
      setParticles([]);
      return;
    }

    // Spawn particles
    const initialParticles: Particle[] = activeEdges.flatMap(edge => {
      const count = edge.status === 'active' ? 3 : 1;
      return Array.from({ length: count }, (_, i) => ({
        id: `${edge.id}_p${i}`,
        edgeId: edge.id,
        progress: (i / count),
        speed: edge.status === 'active' ? 0.008 + Math.random() * 0.004 : 0.003 + Math.random() * 0.002,
      }));
    });

    setParticles(initialParticles);

    function animate(time: number) {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 16, 3); // normalize to ~60fps
      lastTimeRef.current = time;

      setParticles(prev => prev.map(p => ({
        ...p,
        progress: (p.progress + p.speed * dt) % 1,
      })));
      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frameRef.current);
      lastTimeRef.current = 0;
    };
  }, [edges]);

  return particles;
}

// --- Aggregate Stats View ---

interface AggregateData {
  workflowName: string;
  stepNames: string[];
  stepStats: Map<string, { total: number; completed: number; failed: number; cached: number; avgDuration: number }>;
  totalRuns: number;
}

function computeAggregates(executions: WorkflowExecution[]): AggregateData[] {
  const byWorkflow = new Map<string, WorkflowExecution[]>();
  executions.forEach(ex => {
    const list = byWorkflow.get(ex.workflowName) || [];
    list.push(ex);
    byWorkflow.set(ex.workflowName, list);
  });

  return Array.from(byWorkflow.entries())
    .map(([workflowName, execs]) => {
      const stepNames = execs[0]?.steps.map(s => s.name) || [];
      const stepStats = new Map<string, { total: number; completed: number; failed: number; cached: number; avgDuration: number }>();

      stepNames.forEach(name => {
        const steps = execs.flatMap(ex => ex.steps.filter(s => s.name === name));
        const total = steps.length;
        const completed = steps.filter(s => s.status === 'completed').length;
        const failed = steps.filter(s => s.status === 'failed').length;
        const cached = steps.filter(s => s.status === 'cached').length;
        const avgDuration = steps.reduce((sum, s) => sum + (s.duration || 0), 0) / total;
        stepStats.set(name, { total, completed, failed, cached, avgDuration });
      });

      return { workflowName, stepNames, stepStats, totalRuns: execs.length };
    })
    .sort((a, b) => b.totalRuns - a.totalRuns);
}

// --- Components ---

interface FlowGraphProps {
  executions: WorkflowExecution[];
  selectedExecution: WorkflowExecution | null;
  onSelectExecution: (ex: WorkflowExecution | null) => void;
}

export function FlowGraph({ executions, selectedExecution, onSelectExecution }: FlowGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // If an execution is selected, show its flow; otherwise show aggregate
  const mode = selectedExecution ? 'detail' : 'aggregate';
  const aggregates = useMemo(() => computeAggregates(executions), [executions]);

  // Auto-select first workflow for aggregate view
  const activeWorkflow = selectedWorkflow || aggregates[0]?.workflowName || null;

  if (mode === 'detail' && selectedExecution) {
    return (
      <DetailFlowView
        execution={selectedExecution}
        hoveredNode={hoveredNode}
        setHoveredNode={setHoveredNode}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        onClose={() => onSelectExecution(null)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Workflow selector */}
      <div
        className="flex items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: 'var(--ds-border-secondary)', backgroundColor: 'var(--ds-bg-secondary)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--ds-text-muted)' }}>Workflow:</span>
        <div className="flex flex-wrap gap-1.5">
          {aggregates.map(agg => (
            <button
              key={agg.workflowName}
              onClick={() => setSelectedWorkflow(agg.workflowName)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                activeWorkflow === agg.workflowName
                  ? 'bg-conductor-500/20 text-conductor-300 ring-1 ring-conductor-500/30'
                  : 'hover:bg-white/5',
              )}
              style={{
                color: activeWorkflow === agg.workflowName ? undefined : 'var(--ds-text-tertiary)',
              }}
            >
              {agg.workflowName}
              <span className="ml-1 opacity-50">({agg.totalRuns})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate flow view */}
      {activeWorkflow && (
        <AggregateFlowView
          data={aggregates.find(a => a.workflowName === activeWorkflow)!}
          executions={executions.filter(e => e.workflowName === activeWorkflow)}
          onSelectExecution={onSelectExecution}
        />
      )}
    </div>
  );
}

// --- Detail Flow View (single execution) ---

function DetailFlowView({
  execution,
  hoveredNode,
  setHoveredNode,
  selectedNode,
  setSelectedNode,
  onClose,
}: {
  execution: WorkflowExecution;
  hoveredNode: string | null;
  setHoveredNode: (id: string | null) => void;
  selectedNode: FlowNode | null;
  setSelectedNode: (node: FlowNode | null) => void;
  onClose: () => void;
}) {
  const nodes = useMemo(() => layoutNodes(execution.steps), [execution.steps]);
  const edges = useMemo(() => buildEdges(nodes), [nodes]);
  const particles = useParticles(edges);

  const svgWidth = Math.max(...nodes.map(n => n.x + NODE_WIDTH)) + 80;
  const svgHeight = Math.max(...nodes.map(n => n.y + NODE_HEIGHT)) + 80;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-2.5"
        style={{ borderColor: 'var(--ds-border-secondary)', backgroundColor: 'var(--ds-bg-secondary)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
            {execution.workflowName}
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{
            backgroundColor: STATUS_COLORS[execution.status]?.glow,
            color: STATUS_COLORS[execution.status]?.bg,
          }}>
            {execution.status}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--ds-text-muted)' }}>
            {execution.steps.length} steps • {formatDuration(execution.duration || 0)}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 transition-colors hover:bg-white/10"
          style={{ color: 'var(--ds-text-muted)' }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* SVG canvas */}
      <div className="flex flex-1 overflow-auto">
        <div className="flex-1 overflow-auto p-6">
          <svg width={svgWidth} height={svgHeight} className="select-none">
            {/* Edges */}
            {edges.map(edge => {
              const path = computeEdgePath(edge.from, edge.to);
              return (
                <g key={edge.id}>
                  {/* Edge shadow */}
                  <path
                    d={path}
                    fill="none"
                    stroke={edgeColor(edge.status)}
                    strokeWidth={edge.status === 'active' ? 3 : 2}
                    strokeLinecap="round"
                    opacity={0.4}
                    filter="url(#glow)"
                  />
                  {/* Edge path */}
                  <path
                    d={path}
                    fill="none"
                    stroke={edgeColor(edge.status)}
                    strokeWidth={edge.status === 'active' ? 2.5 : 1.5}
                    strokeLinecap="round"
                    strokeDasharray={edge.status === 'pending' ? '4 4' : undefined}
                  />
                </g>
              );
            })}

            {/* Particles */}
            {particles.map(particle => {
              const edge = edges.find(e => e.id === particle.edgeId);
              if (!edge) return null;
              const path = computeEdgePath(edge.from, edge.to);
              return (
                <ParticleCircle
                  key={particle.id}
                  path={path}
                  progress={particle.progress}
                  color={edgeColor(edge.status)}
                />
              );
            })}

            {/* Glow filter */}
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Nodes */}
            {nodes.map(node => {
              const colors = STATUS_COLORS[node.step.status] || STATUS_COLORS.pending;
              const isHovered = hoveredNode === node.id;
              const isSelected = selectedNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(isSelected ? null : node)}
                  className="cursor-pointer"
                >
                  {/* Node glow */}
                  {(isHovered || node.step.status === 'running') && (
                    <rect
                      x={node.x - 4}
                      y={node.y - 4}
                      width={NODE_WIDTH + 8}
                      height={NODE_HEIGHT + 8}
                      rx={14}
                      fill={colors.glow}
                      filter="url(#nodeGlow)"
                      opacity={node.step.status === 'running' ? 0.6 : 0.4}
                    />
                  )}
                  {/* Node background */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={10}
                    fill="var(--ds-bg-tertiary)"
                    stroke={isSelected ? colors.bg : colors.border}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  {/* Status indicator bar */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={4}
                    height={NODE_HEIGHT}
                    rx={2}
                    fill={colors.bg}
                  />
                  {/* Step name */}
                  <text
                    x={node.x + 16}
                    y={node.y + 24}
                    fontSize={11}
                    fontWeight={600}
                    fill="var(--ds-text-primary)"
                    fontFamily="inherit"
                  >
                    {node.step.name.length > 18 ? node.step.name.slice(0, 16) + '…' : node.step.name}
                  </text>
                  {/* Duration + status */}
                  <text
                    x={node.x + 16}
                    y={node.y + 44}
                    fontSize={10}
                    fill="var(--ds-text-muted)"
                    fontFamily="inherit"
                  >
                    {node.step.status}{node.step.duration ? ` • ${formatDuration(node.step.duration)}` : ''}
                  </text>
                  {/* Retry badge */}
                  {node.step.retryCount > 0 && (
                    <>
                      <circle cx={node.x + NODE_WIDTH - 16} cy={node.y + 14} r={9} fill="rgba(239,68,68,0.2)" />
                      <text
                        x={node.x + NODE_WIDTH - 16}
                        y={node.y + 18}
                        fontSize={9}
                        fill="var(--ds-status-error)"
                        textAnchor="middle"
                        fontWeight={700}
                        fontFamily="inherit"
                      >
                        {node.step.retryCount}×
                      </text>
                    </>
                  )}
                  {/* Cached badge */}
                  {node.step.cached && (
                    <text
                      x={node.x + NODE_WIDTH - 16}
                      y={node.y + NODE_HEIGHT - 10}
                      fontSize={8}
                      fill="var(--ds-status-cached)"
                      textAnchor="middle"
                      fontFamily="inherit"
                    >
                      ⚡ cached
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Step detail sidebar */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="overflow-y-auto border-l"
              style={{ borderColor: 'var(--ds-border-secondary)', backgroundColor: 'var(--ds-bg-secondary)' }}
            >
              <StepDetailPanel step={selectedNode.step} onClose={() => setSelectedNode(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Particle Circle using path interpolation ---

function ParticleCircle({ path, progress, color }: { path: string; progress: number; color: string }) {
  const ref = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    if (!pathRef.current) {
      // Create a temporary path element for length calculations
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', path);
      svg.appendChild(p);
      document.body.appendChild(svg);
      pathRef.current = p;
      document.body.removeChild(svg);
    }
  }, [path]);

  // Compute position along path
  const pathEl = useMemo(() => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', path);
    return p;
  }, [path]);

  const length = pathEl.getTotalLength();
  const point = pathEl.getPointAtLength(progress * length);

  return (
    <circle
      ref={ref}
      cx={point.x}
      cy={point.y}
      r={3.5}
      fill={color}
      opacity={0.9}
      filter="url(#glow)"
    />
  );
}

// --- Step Detail Panel ---

function StepDetailPanel({ step, onClose }: { step: StepExecution; onClose: () => void }) {
  const colors = STATUS_COLORS[step.status] || STATUS_COLORS.pending;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: 'var(--ds-text-primary)' }}>{step.name}</h3>
        <button onClick={onClose} className="rounded p-1 hover:bg-white/10" style={{ color: 'var(--ds-text-muted)' }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        {getStatusIcon(step.status, 'h-4 w-4')}
        <span className="text-xs font-medium capitalize" style={{ color: colors.bg }}>{step.status}</span>
        {step.duration && (
          <span className="text-[10px] ml-auto" style={{ color: 'var(--ds-text-muted)' }}>
            {formatDuration(step.duration)}
          </span>
        )}
      </div>

      {/* Retry info */}
      {step.retryCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
          <RefreshCw className="h-3.5 w-3.5" style={{ color: 'var(--ds-status-error)' }} />
          <span className="text-xs" style={{ color: 'var(--ds-status-error)' }}>
            Retried {step.retryCount} time{step.retryCount > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Traces */}
      <div>
        <h4 className="text-[10px] uppercase tracking-wider font-medium mb-2" style={{ color: 'var(--ds-text-muted)' }}>
          Traces ({step.traces.length})
        </h4>
        <div className="space-y-1.5">
          {step.traces.map(trace => (
            <div
              key={trace.id}
              className="rounded-lg p-2 text-xs flex items-center gap-2"
              style={{ backgroundColor: 'var(--ds-bg-tertiary)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: trace.status === 'success' ? 'var(--ds-status-success)' : 'var(--ds-status-error)' }}
              />
              <span className="truncate flex-1" style={{ color: 'var(--ds-text-secondary)' }}>{trace.name}</span>
              <span style={{ color: 'var(--ds-text-muted)' }}>{trace.duration}ms</span>
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
              <div
                key={ev.id}
                className="rounded-lg p-2 text-xs"
                style={{ backgroundColor: 'var(--ds-bg-tertiary)' }}
              >
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
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${ev.score * 100}%`,
                          backgroundColor: ev.score > 0.7 ? 'var(--ds-status-success)' : ev.score > 0.4 ? 'var(--ds-status-warning)' : 'var(--ds-status-error)',
                        }}
                      />
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

// --- Aggregate Flow View ---

function AggregateFlowView({
  data,
  executions,
  onSelectExecution,
}: {
  data: AggregateData;
  executions: WorkflowExecution[];
  onSelectExecution: (ex: WorkflowExecution | null) => void;
}) {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  // Layout aggregate nodes
  const COLS = Math.min(data.stepNames.length, 5);
  const nodes = data.stepNames.map((name, i) => ({
    name,
    col: i % COLS,
    row: Math.floor(i / COLS),
    x: (i % COLS) * (NODE_WIDTH + H_GAP + 20) + 60,
    y: Math.floor(i / COLS) * (NODE_HEIGHT + V_GAP + 60) + 60,
    stats: data.stepStats.get(name)!,
  }));

  const svgWidth = Math.max(...nodes.map(n => n.x + NODE_WIDTH)) + 100;
  const svgHeight = Math.max(...nodes.map(n => n.y + NODE_HEIGHT)) + 100;

  // Build aggregate edges
  const aggEdges = nodes.slice(0, -1).map((from, i) => {
    const to = nodes[i + 1];
    const successRate = from.stats.completed / from.stats.total;
    return { from, to, successRate };
  });

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Graph */}
      <div className="flex-1 overflow-auto p-6">
        <svg width={svgWidth} height={svgHeight} className="select-none">
          <defs>
            <filter id="aggGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="successGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(34,197,94,0.6)" />
              <stop offset="100%" stopColor="rgba(34,197,94,0.3)" />
            </linearGradient>
          </defs>

          {/* Edges */}
          {aggEdges.map((edge, i) => {
            const path = computeAggEdgePath(edge.from, edge.to);
            const opacity = 0.3 + edge.successRate * 0.5;
            const width = 1 + edge.successRate * 2;
            return (
              <g key={i}>
                <path
                  d={path}
                  fill="none"
                  stroke={`rgba(34,197,94,${opacity})`}
                  strokeWidth={width}
                  strokeLinecap="round"
                />
                {/* Flow arrow */}
                <path
                  d={path}
                  fill="none"
                  stroke={`rgba(34,197,94,${opacity * 0.5})`}
                  strokeWidth={width + 4}
                  strokeLinecap="round"
                  filter="url(#aggGlow)"
                />
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const isHovered = hoveredStep === node.name;
            const successRate = node.stats.completed / node.stats.total;
            const failRate = node.stats.failed / node.stats.total;

            return (
              <g
                key={node.name}
                onMouseEnter={() => setHoveredStep(node.name)}
                onMouseLeave={() => setHoveredStep(null)}
                className="cursor-pointer"
              >
                {/* Glow on hover */}
                {isHovered && (
                  <rect
                    x={node.x - 4}
                    y={node.y - 4}
                    width={NODE_WIDTH + 8}
                    height={NODE_HEIGHT + 28}
                    rx={14}
                    fill="rgba(139,92,246,0.1)"
                    filter="url(#aggGlow)"
                  />
                )}
                {/* Card */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT + 20}
                  rx={10}
                  fill="var(--ds-bg-tertiary)"
                  stroke={isHovered ? 'rgba(139,92,246,0.5)' : 'var(--ds-border-primary)'}
                  strokeWidth={isHovered ? 1.5 : 1}
                />
                {/* Success rate bar */}
                <rect
                  x={node.x + 8}
                  y={node.y + NODE_HEIGHT + 6}
                  width={(NODE_WIDTH - 16) * successRate}
                  height={4}
                  rx={2}
                  fill="var(--ds-status-success)"
                  opacity={0.8}
                />
                {failRate > 0 && (
                  <rect
                    x={node.x + 8 + (NODE_WIDTH - 16) * successRate}
                    y={node.y + NODE_HEIGHT + 6}
                    width={(NODE_WIDTH - 16) * failRate}
                    height={4}
                    rx={2}
                    fill="var(--ds-status-error)"
                    opacity={0.8}
                  />
                )}
                <rect
                  x={node.x + 8}
                  y={node.y + NODE_HEIGHT + 6}
                  width={NODE_WIDTH - 16}
                  height={4}
                  rx={2}
                  fill="var(--ds-text-muted)"
                  opacity={0.1}
                />
                {/* Step name */}
                <text
                  x={node.x + 12}
                  y={node.y + 22}
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--ds-text-primary)"
                  fontFamily="inherit"
                >
                  {node.name.length > 18 ? node.name.slice(0, 16) + '…' : node.name}
                </text>
                {/* Stats row */}
                <text
                  x={node.x + 12}
                  y={node.y + 40}
                  fontSize={10}
                  fill="var(--ds-text-muted)"
                  fontFamily="inherit"
                >
                  {(successRate * 100).toFixed(0)}% pass • {formatDuration(node.stats.avgDuration)} avg
                </text>
                {/* Count */}
                <text
                  x={node.x + 12}
                  y={node.y + 56}
                  fontSize={9}
                  fill="var(--ds-text-muted)"
                  fontFamily="inherit"
                  opacity={0.6}
                >
                  {node.stats.total} runs • {node.stats.cached} cached
                </text>
                {/* Step number badge */}
                <circle cx={node.x + NODE_WIDTH - 14} cy={node.y + 14} r={10} fill="var(--ds-bg-app)" stroke="var(--ds-border-primary)" strokeWidth={1} />
                <text
                  x={node.x + NODE_WIDTH - 14}
                  y={node.y + 18}
                  fontSize={9}
                  fill="var(--ds-text-muted)"
                  textAnchor="middle"
                  fontWeight={600}
                  fontFamily="inherit"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Recent executions sidebar */}
      <div
        className="w-72 overflow-y-auto border-l"
        style={{ borderColor: 'var(--ds-border-secondary)', backgroundColor: 'var(--ds-bg-secondary)' }}
      >
        <div className="p-3 border-b" style={{ borderColor: 'var(--ds-border-secondary)' }}>
          <h3 className="text-xs font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
            Recent Runs
          </h3>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--ds-text-muted)' }}>
            Click to inspect flow
          </p>
        </div>
        <div className="space-y-0.5 p-1.5">
          {executions.slice(0, 30).map(ex => (
            <button
              key={ex.id}
              onClick={() => onSelectExecution(ex)}
              className="w-full rounded-lg p-2.5 text-left transition-all hover:bg-white/5 flex items-center gap-2"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: STATUS_COLORS[ex.status]?.bg || 'var(--ds-text-muted)',
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate" style={{ color: 'var(--ds-text-secondary)' }}>
                  {ex.id.slice(0, 12)}
                </p>
                <p className="text-[9px]" style={{ color: 'var(--ds-text-muted)' }}>
                  {ex.steps.filter(s => s.status === 'completed' || s.status === 'cached').length}/{ex.steps.length} steps • {formatDuration(ex.duration || 0)}
                </p>
              </div>
              <ChevronRight className="h-3 w-3 flex-shrink-0" style={{ color: 'var(--ds-text-muted)' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function computeAggEdgePath(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const COLS = 5;
  if (from.y === to.y) {
    // Same row
    const x1 = from.x + NODE_WIDTH;
    const y1 = from.y + (NODE_HEIGHT + 20) / 2;
    const x2 = to.x;
    const y2 = to.y + (NODE_HEIGHT + 20) / 2;
    const cx1 = x1 + (x2 - x1) * 0.4;
    const cx2 = x1 + (x2 - x1) * 0.6;
    return `M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`;
  }
  // Different row
  const x1 = from.x + NODE_WIDTH / 2;
  const y1 = from.y + NODE_HEIGHT + 20;
  const x2 = to.x + NODE_WIDTH / 2;
  const y2 = to.y;
  const midY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
}
