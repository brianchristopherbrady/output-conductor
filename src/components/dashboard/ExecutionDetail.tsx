import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Coins, Cpu, RotateCcw, CheckCircle2, XCircle, Database } from 'lucide-react';
import { format } from 'date-fns';
import { WorkflowExecution, StepExecution } from '@/types';
import { cn, formatDuration, formatCost, formatTokens, getStatusDot } from '@/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface ExecutionDetailProps {
  execution: WorkflowExecution;
  onClose: () => void;
}

function StepCard({ step, index }: { step: StepExecution; index: number }) {
  const llmTraces = step.traces.filter(t => t.type === 'llm');
  const totalStepTokens = llmTraces.reduce(
    (sum, t) => sum + (t.metadata.inputTokens || 0) + (t.metadata.outputTokens || 0), 0
  );
  const totalStepCost = llmTraces.reduce((sum, t) => sum + (t.metadata.cost || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'relative rounded-lg border p-3',
        step.status === 'completed' && 'border-emerald-500/20 bg-emerald-500/5',
        step.status === 'cached' && 'border-cyan-500/20 bg-cyan-500/5',
        step.status === 'running' && 'border-indigo-500/20 bg-indigo-500/5',
        step.status === 'failed' && 'border-red-500/20 bg-red-500/5',
        step.status === 'pending' && 'border-zinc-700/50 bg-zinc-800/30',
      )}
    >
      {/* Connection line */}
      {index > 0 && (
        <div className="absolute -top-3 left-5 h-3 w-px bg-zinc-700" />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn('h-2.5 w-2.5 rounded-full', getStatusDot(step.status))} />
          <span className="text-sm font-medium text-zinc-200 font-mono">{step.name}</span>
          <StatusBadge status={step.status} />
          {step.cached && (
            <span className="flex items-center gap-1 text-xs text-cyan-400">
              <Database className="h-3 w-3" />
              cached
            </span>
          )}
        </div>
        {step.duration !== undefined && (
          <span className="text-xs font-mono text-zinc-500">{formatDuration(step.duration)}</span>
        )}
      </div>

      {/* Trace details */}
      {step.traces.length > 0 && (
        <div className="mt-2 ml-5 space-y-1">
          {step.traces.map(trace => (
            <div key={trace.id} className="flex items-center gap-2 text-xs text-zinc-500">
              <span className={cn(
                'rounded px-1 py-0.5 text-[10px] font-medium uppercase',
                trace.type === 'llm' && 'bg-purple-500/10 text-purple-400',
                trace.type === 'http' && 'bg-blue-500/10 text-blue-400',
                trace.type === 'tool' && 'bg-amber-500/10 text-amber-400',
                trace.type === 'eval' && 'bg-green-500/10 text-green-400',
              )}>
                {trace.type}
              </span>
              <span className="truncate">{trace.name}</span>
              <span className="font-mono">{formatDuration(trace.duration)}</span>
              {trace.metadata.model && (
                <span className="text-zinc-600">{trace.metadata.model}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Evaluation results */}
      {step.evaluations && step.evaluations.length > 0 && (
        <div className="mt-2 ml-5 space-y-1">
          {step.evaluations.map(evalResult => (
            <div
              key={evalResult.id}
              className={cn(
                'flex items-center gap-2 rounded border px-2 py-1 text-xs',
                evalResult.passed
                  ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                  : 'border-red-500/20 bg-red-500/5 text-red-400'
              )}
            >
              {evalResult.passed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              <span className="font-medium">{evalResult.evaluatorName}</span>
              <span className="text-zinc-500">confidence: {evalResult.confidence}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Step metrics */}
      {totalStepTokens > 0 && (
        <div className="mt-2 ml-5 flex gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            {formatTokens(totalStepTokens)}
          </span>
          <span className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {formatCost(totalStepCost)}
          </span>
          {step.retryCount > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <RotateCcw className="h-3 w-3" />
              {step.retryCount} retries
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function ExecutionDetail({ execution, onClose }: ExecutionDetailProps) {
  return (
    <AnimatePresence>
      <motion.div
        key={execution.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-100">{execution.workflowName}</h2>
              <StatusBadge status={execution.status} size="md" />
            </div>
            <p className="mt-0.5 text-xs font-mono text-zinc-500">{execution.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Metrics bar */}
        <div className="grid grid-cols-4 gap-2 border-b border-zinc-800 px-4 py-3">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Duration</p>
            <p className="text-sm font-semibold text-zinc-200">{execution.duration ? formatDuration(execution.duration) : '—'}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Tokens</p>
            <p className="text-sm font-semibold text-zinc-200">{formatTokens(execution.totalTokens)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Cost</p>
            <p className="text-sm font-semibold text-zinc-200">{formatCost(execution.totalCost)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Model</p>
            <p className="text-sm font-semibold text-zinc-200 truncate">{execution.model.split('-').slice(0, 2).join('-')}</p>
          </div>
        </div>

        {/* Steps timeline */}
        <div className="flex-1 overflow-auto px-4 py-3">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Execution Steps ({execution.steps.length})
          </h3>
          <div className="space-y-3">
            {execution.steps.map((step, index) => (
              <StepCard key={step.id} step={step} index={index} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Started {format(execution.startedAt, 'MMM dd, HH:mm:ss')}
            </span>
            <span>{execution.provider}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
