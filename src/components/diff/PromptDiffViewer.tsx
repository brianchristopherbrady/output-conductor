import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, FileText, MessageSquare } from 'lucide-react';
import { WorkflowExecution, Trace } from '@/types';
import { formatCost, formatDuration, formatTokens } from '@/utils';

interface PromptDiffViewerProps {
  executions: WorkflowExecution[];
}

type DiffKind = 'unchanged' | 'removed' | 'added';

interface DiffRow {
  left?: {
    lineNumber: number;
    text: string;
    kind: DiffKind;
  };
  right?: {
    lineNumber: number;
    text: string;
    kind: DiffKind;
  };
}

interface StepTraceSummary {
  traces: Trace[];
  promptText: string;
  responseText: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  duration: number;
  models: string[];
}

function getExecutionLabel(execution: WorkflowExecution): string {
  return `${execution.workflowName} • ${execution.id.slice(0, 8)}`;
}

function getLineStyle(kind?: DiffKind) {
  if (kind === 'added') {
    return {
      backgroundColor: 'color-mix(in srgb, var(--ds-status-success) 16%, var(--ds-bg-tertiary))',
      borderLeft: '3px solid var(--ds-status-success)',
    };
  }

  if (kind === 'removed') {
    return {
      backgroundColor: 'color-mix(in srgb, var(--ds-status-error) 16%, var(--ds-bg-tertiary))',
      borderLeft: '3px solid var(--ds-status-error)',
    };
  }

  return {
    backgroundColor: 'var(--ds-bg-tertiary)',
    borderLeft: '3px solid transparent',
  };
}

function splitLines(text: string): string[] {
  if (!text) return [];
  return text.replace(/\r\n/g, '\n').split('\n');
}

function diffLines(leftText: string, rightText: string): DiffRow[] {
  const leftLines = splitLines(leftText);
  const rightLines = splitLines(rightText);
  const rows: DiffRow[] = [];
  const dp = Array.from({ length: leftLines.length + 1 }, () => Array<number>(rightLines.length + 1).fill(0));

  for (let leftIndex = leftLines.length - 1; leftIndex >= 0; leftIndex -= 1) {
    for (let rightIndex = rightLines.length - 1; rightIndex >= 0; rightIndex -= 1) {
      if (leftLines[leftIndex] === rightLines[rightIndex]) {
        dp[leftIndex][rightIndex] = dp[leftIndex + 1][rightIndex + 1] + 1;
      } else {
        dp[leftIndex][rightIndex] = Math.max(dp[leftIndex + 1][rightIndex], dp[leftIndex][rightIndex + 1]);
      }
    }
  }

  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < leftLines.length && rightIndex < rightLines.length) {
    if (leftLines[leftIndex] === rightLines[rightIndex]) {
      rows.push({
        left: { lineNumber: leftIndex + 1, text: leftLines[leftIndex], kind: 'unchanged' },
        right: { lineNumber: rightIndex + 1, text: rightLines[rightIndex], kind: 'unchanged' },
      });
      leftIndex += 1;
      rightIndex += 1;
      continue;
    }

    if (dp[leftIndex + 1][rightIndex] >= dp[leftIndex][rightIndex + 1]) {
      rows.push({
        left: { lineNumber: leftIndex + 1, text: leftLines[leftIndex], kind: 'removed' },
      });
      leftIndex += 1;
      continue;
    }

    rows.push({
      right: { lineNumber: rightIndex + 1, text: rightLines[rightIndex], kind: 'added' },
    });
    rightIndex += 1;
  }

  while (leftIndex < leftLines.length) {
    rows.push({
      left: { lineNumber: leftIndex + 1, text: leftLines[leftIndex], kind: 'removed' },
    });
    leftIndex += 1;
  }

  while (rightIndex < rightLines.length) {
    rows.push({
      right: { lineNumber: rightIndex + 1, text: rightLines[rightIndex], kind: 'added' },
    });
    rightIndex += 1;
  }

  return rows;
}

function buildTraceText(traces: Trace[], field: 'prompt' | 'response'): string {
  if (traces.length === 0) return '';
  if (traces.length === 1) return traces[0].metadata[field] ?? '';

  return traces
    .map((trace, index) => {
      const value = trace.metadata[field] ?? '';
      const header = `# Trace ${index + 1}: ${trace.name}`;
      return value ? `${header}\n${value}` : header;
    })
    .join('\n\n');
}

function summarizeStep(execution: WorkflowExecution | undefined, stepName: string | undefined): StepTraceSummary {
  const step = execution?.steps.find(({ name }) => name === stepName);
  const traces = step?.traces.filter(({ type }) => type === 'llm') ?? [];
  const inputTokens = traces.reduce((sum, trace) => sum + (trace.metadata.inputTokens ?? 0), 0);
  const outputTokens = traces.reduce((sum, trace) => sum + (trace.metadata.outputTokens ?? 0), 0);
  const cost = traces.reduce((sum, trace) => sum + (trace.metadata.cost ?? 0), 0);
  const duration = traces.reduce((sum, trace) => sum + trace.duration, 0);
  const models = Array.from(new Set(traces.map(trace => trace.metadata.model).filter((model): model is string => Boolean(model))));

  return {
    traces,
    promptText: buildTraceText(traces, 'prompt'),
    responseText: buildTraceText(traces, 'response'),
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    cost,
    duration,
    models,
  };
}

function MetricPanel({
  title,
  summary,
}: {
  title: string;
  summary: StepTraceSummary;
}) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        backgroundColor: 'var(--ds-bg-secondary)',
        borderColor: 'var(--ds-border-primary)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
            {title}
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--ds-text-muted)' }}>
            {summary.traces.length} LLM trace{summary.traces.length === 1 ? '' : 's'}
          </p>
        </div>
        {summary.models.length > 0 && (
          <span
            className="max-w-[14rem] truncate rounded-md px-2 py-1 text-[11px]"
            style={{
              backgroundColor: 'var(--ds-bg-tertiary)',
              color: 'var(--ds-text-muted)',
            }}
            title={summary.models.join(', ')}
          >
            {summary.models.join(', ')}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p style={{ color: 'var(--ds-text-muted)' }}>Tokens</p>
          <p className="mt-1 font-medium" style={{ color: 'var(--ds-text-primary)' }}>
            {formatTokens(summary.totalTokens)}
          </p>
          <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
            In {formatTokens(summary.inputTokens)} / Out {formatTokens(summary.outputTokens)}
          </p>
        </div>
        <div>
          <p style={{ color: 'var(--ds-text-muted)' }}>Cost</p>
          <p className="mt-1 font-medium" style={{ color: 'var(--ds-text-primary)' }}>
            {formatCost(summary.cost)}
          </p>
        </div>
        <div>
          <p style={{ color: 'var(--ds-text-muted)' }}>Duration</p>
          <p className="mt-1 font-medium" style={{ color: 'var(--ds-text-primary)' }}>
            {formatDuration(summary.duration)}
          </p>
        </div>
      </div>
    </div>
  );
}

function DiffCell({
  lineNumber,
  text,
  kind,
}: {
  lineNumber?: number;
  text?: string;
  kind?: DiffKind;
}) {
  return (
    <div
      className="min-w-0 overflow-x-auto px-3 py-2"
      style={{
        ...getLineStyle(kind),
        borderBottom: '1px solid color-mix(in srgb, var(--ds-border-primary) 70%, transparent)',
      }}
    >
      <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3 font-mono text-sm leading-6">
        <span className="select-none text-right" style={{ color: 'var(--ds-text-muted)' }}>
          {lineNumber ?? ''}
        </span>
        <pre className="whitespace-pre-wrap break-words" style={{ color: 'var(--ds-text-primary)' }}>
          {text && text.length > 0 ? text : ' '}
        </pre>
      </div>
    </div>
  );
}

function DiffSection({
  icon,
  title,
  rows,
  leftLabel,
  rightLabel,
}: {
  icon: React.ReactNode;
  title: string;
  rows: DiffRow[];
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
        {icon}
        <span>{title}</span>
      </div>

      <div
        className="overflow-hidden rounded-lg border"
        style={{
          backgroundColor: 'var(--ds-bg-secondary)',
          borderColor: 'var(--ds-border-primary)',
        }}
      >
        <div
          className="grid gap-px md:grid-cols-2"
          style={{ backgroundColor: 'var(--ds-border-primary)' }}
        >
          {[leftLabel, rightLabel].map(label => (
            <div
              key={label}
              className="px-4 py-3 text-xs font-medium uppercase tracking-[0.2em]"
              style={{
                backgroundColor: 'var(--ds-bg-tertiary)',
                color: 'var(--ds-text-muted)',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div>
          {rows.length === 0 ? (
            <div className="px-4 py-6 text-sm" style={{ color: 'var(--ds-text-muted)' }}>
              Nothing to compare.
            </div>
          ) : (
            rows.map((row, index) => (
              <div
                key={`${title}-${index}`}
                className="grid gap-px md:grid-cols-2"
                style={{ backgroundColor: 'var(--ds-border-primary)' }}
              >
                <DiffCell lineNumber={row.left?.lineNumber} text={row.left?.text} kind={row.left?.kind} />
                <DiffCell lineNumber={row.right?.lineNumber} text={row.right?.text} kind={row.right?.kind} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export function PromptDiffViewer({ executions }: PromptDiffViewerProps) {
  const [runAId, setRunAId] = useState('');
  const [runBId, setRunBId] = useState('');
  const [selectedStepName, setSelectedStepName] = useState('');

  useEffect(() => {
    if (executions.length === 0) {
      setRunAId('');
      setRunBId('');
      return;
    }

    setRunAId(current => (executions.some(execution => execution.id === current) ? current : executions[0].id));
    setRunBId(current => {
      if (executions.some(execution => execution.id === current)) {
        return current;
      }

      return executions[1]?.id ?? executions[0].id;
    });
  }, [executions]);

  const runA = useMemo(
    () => executions.find(execution => execution.id === runAId),
    [executions, runAId],
  );
  const runB = useMemo(
    () => executions.find(execution => execution.id === runBId),
    [executions, runBId],
  );

  const sharedStepNames = useMemo(() => {
    if (!runA || !runB) return [];

    const runBStepNames = new Set(runB.steps.map(step => step.name));
    return runA.steps.map(step => step.name).filter((stepName, index, names) => runBStepNames.has(stepName) && names.indexOf(stepName) === index);
  }, [runA, runB]);

  useEffect(() => {
    setSelectedStepName(current => (sharedStepNames.includes(current) ? current : (sharedStepNames[0] ?? '')));
  }, [sharedStepNames]);

  const runASummary = useMemo(
    () => summarizeStep(runA, selectedStepName),
    [runA, selectedStepName],
  );
  const runBSummary = useMemo(
    () => summarizeStep(runB, selectedStepName),
    [runB, selectedStepName],
  );

  const promptRows = useMemo(
    () => diffLines(runASummary.promptText, runBSummary.promptText),
    [runASummary.promptText, runBSummary.promptText],
  );
  const responseRows = useMemo(
    () => diffLines(runASummary.responseText, runBSummary.responseText),
    [runASummary.responseText, runBSummary.responseText],
  );

  if (executions.length < 2) {
    return (
      <div
        className="rounded-lg border px-4 py-6 text-sm"
        style={{
          backgroundColor: 'var(--ds-bg-secondary)',
          borderColor: 'var(--ds-border-primary)',
          color: 'var(--ds-text-muted)',
        }}
      >
        Add at least two workflow executions to compare prompts.
      </div>
    );
  }

  const leftLabel = `Run A • ${runA ? getExecutionLabel(runA) : 'Select a run'}`;
  const rightLabel = `Run B • ${runB ? getExecutionLabel(runB) : 'Select a run'}`;
  const noSharedSteps = sharedStepNames.length === 0;
  const noLlmTraces = selectedStepName.length > 0 && runASummary.traces.length === 0 && runBSummary.traces.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
        <ArrowLeftRight className="h-4 w-4" />
        <span>Prompt Diff Viewer</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="space-y-2 text-sm">
          <span style={{ color: 'var(--ds-text-muted)' }}>Run A</span>
          <select
            value={runAId}
            onChange={(event) => setRunAId(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none transition-colors"
            style={{
              backgroundColor: 'var(--ds-bg-secondary)',
              borderColor: 'var(--ds-border-primary)',
              color: 'var(--ds-text-primary)',
            }}
          >
            {executions.map(execution => (
              <option key={execution.id} value={execution.id}>
                {getExecutionLabel(execution)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span style={{ color: 'var(--ds-text-muted)' }}>Run B</span>
          <select
            value={runBId}
            onChange={(event) => setRunBId(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 outline-none transition-colors"
            style={{
              backgroundColor: 'var(--ds-bg-secondary)',
              borderColor: 'var(--ds-border-primary)',
              color: 'var(--ds-text-primary)',
            }}
          >
            {executions.map(execution => (
              <option key={execution.id} value={execution.id}>
                {getExecutionLabel(execution)}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm">
          <span style={{ color: 'var(--ds-text-muted)' }}>Shared Step</span>
          <select
            value={selectedStepName}
            onChange={(event) => setSelectedStepName(event.target.value)}
            disabled={noSharedSteps}
            className="w-full rounded-lg border px-3 py-2 outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              backgroundColor: 'var(--ds-bg-secondary)',
              borderColor: 'var(--ds-border-primary)',
              color: 'var(--ds-text-primary)',
            }}
          >
            {noSharedSteps ? (
              <option value="">No shared steps</option>
            ) : (
              sharedStepNames.map(stepName => (
                <option key={stepName} value={stepName}>
                  {stepName}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      {noSharedSteps ? (
        <div
          className="rounded-lg border px-4 py-6 text-sm"
          style={{
            backgroundColor: 'var(--ds-bg-secondary)',
            borderColor: 'var(--ds-border-primary)',
            color: 'var(--ds-text-muted)',
          }}
        >
          These runs do not share any step names.
        </div>
      ) : noLlmTraces ? (
        <div
          className="rounded-lg border px-4 py-6 text-sm"
          style={{
            backgroundColor: 'var(--ds-bg-secondary)',
            borderColor: 'var(--ds-border-primary)',
            color: 'var(--ds-text-muted)',
          }}
        >
          No LLM traces in this step.
        </div>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <MetricPanel title={leftLabel} summary={runASummary} />
            <MetricPanel title={rightLabel} summary={runBSummary} />
          </div>

          <DiffSection
            icon={<FileText className="h-4 w-4" />}
            title="Prompt comparison"
            rows={promptRows}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
          />

          <DiffSection
            icon={<MessageSquare className="h-4 w-4" />}
            title="Response comparison"
            rows={responseRows}
            leftLabel={leftLabel}
            rightLabel={rightLabel}
          />
        </>
      )}
    </div>
  );
}
