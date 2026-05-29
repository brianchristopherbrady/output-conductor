import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Coins, Cpu, RotateCcw, CheckCircle2, XCircle, Database } from 'lucide-react';
import { format } from 'date-fns';
import { WorkflowExecution, StepExecution, Trace } from '@/types';
import {
  formatDuration,
  formatCost,
  formatTokens,
  getStatusBorder,
  getStatusColor,
  getStatusDot,
} from '@/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface ExecutionDetailProps {
  execution: WorkflowExecution;
  onClose: () => void;
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

function StepCard({ step, index }: { step: StepExecution; index: number }) {
  const llmTraces = step.traces.filter(t => t.type === 'llm');
  const totalStepTokens = llmTraces.reduce(
    (sum, t) => sum + (t.metadata.inputTokens || 0) + (t.metadata.outputTokens || 0), 0,
  );
  const totalStepCost = llmTraces.reduce((sum, t) => sum + (t.metadata.cost || 0), 0);
  const stepBorderColor = step.status === 'pending' ? 'var(--ds-border-secondary)' : getStatusBorder(step.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative rounded-xl border shadow-sm"
      style={{
        borderColor: stepBorderColor,
        backgroundColor: 'var(--ds-bg-secondary)',
        padding: `var(--ds-panel-py, 12px) var(--ds-panel-px, 16px)`,
      }}
    >
      {index > 0 && (
        <div
          className="absolute -top-3 left-6 h-3 w-px"
          style={{ backgroundColor: 'var(--ds-border-secondary)' }}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: getStatusDot(step.status) }}
          />
          <span className="truncate font-mono text-sm font-medium text-[var(--ds-text-primary)]">
            {step.name}
          </span>
          <StatusBadge status={step.status} />
          {step.cached && (
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
              style={{
                color: 'var(--ds-status-cached)',
                borderColor: 'var(--ds-border-secondary)',
                backgroundColor: 'var(--ds-bg-tertiary)',
              }}
            >
              <Database className="h-3 w-3" />
              cached
            </span>
          )}
        </div>
        {step.duration !== undefined && (
          <span className="text-xs font-mono text-[var(--ds-text-muted)]">
            {formatDuration(step.duration)}
          </span>
        )}
      </div>

      {step.traces.length > 0 && (
        <div className="mt-3 ml-5 space-y-1.5">
          {step.traces.map(trace => (
            <div
              key={trace.id}
              className="flex items-center gap-2 text-xs text-[var(--ds-text-muted)]"
            >
              <span
                className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={getTraceTypeStyles(trace.type)}
              >
                {trace.type}
              </span>
              <span className="truncate text-[var(--ds-text-secondary)]">{trace.name}</span>
              <span className="font-mono text-[var(--ds-text-muted)]">
                {formatDuration(trace.duration)}
              </span>
              {trace.metadata.model && (
                <span className="truncate text-[var(--ds-text-tertiary)]">{trace.metadata.model}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {step.evaluations && step.evaluations.length > 0 && (
        <div className="mt-3 ml-5 space-y-1.5">
          {step.evaluations.map(evalResult => {
            const toneColor = evalResult.passed ? 'var(--ds-status-success)' : 'var(--ds-status-error)';
            const toneBackground = evalResult.passed ? 'var(--ds-status-success-bg)' : 'var(--ds-status-error-bg)';

            return (
              <div
                key={evalResult.id}
                className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs"
                style={{
                  color: toneColor,
                  borderColor: toneColor,
                  backgroundColor: toneBackground,
                }}
              >
                {evalResult.passed ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                <span className="font-medium">{evalResult.evaluatorName}</span>
                <span className="text-[var(--ds-text-muted)]">
                  confidence: {evalResult.confidence}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {totalStepTokens > 0 && (
        <div className="mt-3 ml-5 flex flex-wrap gap-3 text-xs text-[var(--ds-text-muted)]">
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            {formatTokens(totalStepTokens)}
          </span>
          <span className="flex items-center gap-1">
            <Coins className="h-3 w-3" />
            {formatCost(totalStepCost)}
          </span>
          {step.retryCount > 0 && (
            <span className="flex items-center gap-1" style={{ color: 'var(--ds-status-warning)' }}>
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
        className="flex h-full flex-col overflow-hidden rounded-xl border backdrop-blur-xl"
        style={{
          borderColor: 'var(--ds-border-primary)',
          backgroundColor: 'var(--ds-bg-primary)',
        }}
      >
        <div
          className="flex items-center justify-between border-b"
          style={{ borderColor: 'var(--ds-border-primary)', padding: `var(--ds-section-py, 12px) var(--ds-panel-px, 16px)` }}
        >
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--ds-text-primary)]">
                {execution.workflowName}
              </h2>
              <StatusBadge status={execution.status} size="md" />
            </div>
            <p className="mt-0.5 text-xs font-mono text-[var(--ds-text-muted)]">{execution.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--ds-text-muted)] transition-colors hover:bg-[var(--ds-bg-tertiary)] hover:text-[var(--ds-text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="grid grid-cols-4 gap-2 border-b"
          style={{ borderColor: 'var(--ds-border-primary)', padding: `var(--ds-section-py, 12px) var(--ds-panel-px, 16px)` }}
        >
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-[var(--ds-text-muted)]">Duration</p>
            <p className="text-sm font-semibold text-[var(--ds-text-primary)]">
              {execution.duration ? formatDuration(execution.duration) : '—'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-[var(--ds-text-muted)]">Tokens</p>
            <p className="text-sm font-semibold text-[var(--ds-text-primary)]">
              {formatTokens(execution.totalTokens)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-[var(--ds-text-muted)]">Cost</p>
            <p className="text-sm font-semibold text-[var(--ds-text-primary)]">
              {formatCost(execution.totalCost)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-[var(--ds-text-muted)]">Model</p>
            <p className="truncate text-sm font-semibold text-[var(--ds-text-primary)]">
              {execution.model.split('-').slice(0, 2).join('-')}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-auto" style={{ padding: `var(--ds-section-py, 12px) var(--ds-panel-px, 16px)` }}>
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--ds-text-muted)]">
            Execution Steps ({execution.steps.length})
          </h3>
          <div className="space-y-3">
            {execution.steps.map((step, index) => (
              <StepCard key={step.id} step={step} index={index} />
            ))}
          </div>
        </div>

        <div
          className="border-t"
          style={{ borderColor: 'var(--ds-border-primary)', padding: `var(--ds-control-py, 6px) var(--ds-panel-px, 16px)` }}
        >
          <div className="flex items-center justify-between text-xs text-[var(--ds-text-muted)]">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Started {format(execution.startedAt, 'MMM dd, HH:mm:ss')}
            </span>
            <span style={{ color: getStatusColor(execution.status) }}>{execution.provider}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
