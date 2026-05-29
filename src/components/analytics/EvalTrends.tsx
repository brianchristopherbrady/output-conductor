import { useMemo, useState } from 'react';
import { format, endOfDay, parseISO, startOfDay, subDays } from 'date-fns';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { WorkflowExecution } from '@/types';

interface EvalTrendsProps {
  executions: WorkflowExecution[];
}

interface PassRatePoint {
  day: string;
  rates: Record<string, number | null>;
}

interface RegressionAlert {
  evaluatorName: string;
  oldRate: number;
  newRate: number;
  delta: number;
  severity: 'warning' | 'error';
}

const CONFIDENCE_BUCKETS = [
  { label: '60-70', min: 60, max: 70 },
  { label: '70-80', min: 70, max: 80 },
  { label: '80-90', min: 80, max: 90 },
  { label: '90-100', min: 90, max: 100 },
] as const;

const EVALUATOR_COLORS = [
  'var(--color-conductor-500)',
  'var(--ds-status-success)',
  'var(--ds-status-error)',
  'var(--ds-status-warning)',
  'var(--ds-status-info)',
  'var(--ds-status-cached)',
];

const cardStyle = {
  borderColor: 'var(--ds-card-border)',
  backgroundColor: 'var(--ds-card-bg)',
} as const;

const tooltipStyle = {
  backgroundColor: 'var(--ds-tooltip-bg)',
  border: '1px solid var(--ds-border-primary)',
  borderRadius: '12px',
  color: 'var(--ds-tooltip-text)',
} as const;

function asDate(value: Date) {
  return value instanceof Date ? value : new Date(value);
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function getPassRate(passed: number, total: number) {
  return total === 0 ? 0 : Number(((passed / total) * 100).toFixed(1));
}

function getBucketLabel(confidence: number) {
  return CONFIDENCE_BUCKETS.find((bucket, index) => (
    confidence >= bucket.min && (index === CONFIDENCE_BUCKETS.length - 1 ? confidence <= bucket.max : confidence < bucket.max)
  ))?.label;
}

export function EvalTrends({ executions }: EvalTrendsProps) {
  const { evaluatorNames, passRateData, confidenceData, alerts } = useMemo(() => {
    const evaluatorSet = new Set<string>();
    const dailyEvaluations = new Map<string, Map<string, { passed: number; total: number }>>();
    const confidenceBuckets = new Map<string, { passed: number; failed: number; total: number }>(
      CONFIDENCE_BUCKETS.map((bucket) => [bucket.label, { passed: 0, failed: 0, total: 0 }]),
    );

    const referenceDate = executions.length > 0
      ? executions.reduce((latest, execution) => {
        const date = asDate(execution.startedAt);
        return date > latest ? date : latest;
      }, asDate(executions[0].startedAt))
      : new Date();

    const currentWindowStart = startOfDay(subDays(referenceDate, 6));
    const currentWindowEnd = endOfDay(referenceDate);
    const previousWindowStart = startOfDay(subDays(referenceDate, 13));
    const previousWindowEnd = endOfDay(subDays(referenceDate, 7));

    const regressionTotals = new Map<string, {
      currentPassed: number;
      currentTotal: number;
      previousPassed: number;
      previousTotal: number;
    }>();

    executions.forEach((execution) => {
      const executionDate = asDate(execution.startedAt);
      const dayKey = format(executionDate, 'yyyy-MM-dd');
      const dayEntry = dailyEvaluations.get(dayKey) ?? new Map<string, { passed: number; total: number }>();
      dailyEvaluations.set(dayKey, dayEntry);

      execution.steps.forEach((step) => {
        step.evaluations?.forEach((evaluation) => {
          evaluatorSet.add(evaluation.evaluatorName);

          const dayTotals = dayEntry.get(evaluation.evaluatorName) ?? { passed: 0, total: 0 };
          dayTotals.total += 1;
          dayTotals.passed += evaluation.passed ? 1 : 0;
          dayEntry.set(evaluation.evaluatorName, dayTotals);

          const bucketLabel = getBucketLabel(evaluation.confidence);
          if (bucketLabel) {
            const bucketTotals = confidenceBuckets.get(bucketLabel);
            if (bucketTotals) {
              bucketTotals.total += 1;
              bucketTotals.passed += evaluation.passed ? 1 : 0;
              bucketTotals.failed += evaluation.passed ? 0 : 1;
            }
          }

          const regressionEntry = regressionTotals.get(evaluation.evaluatorName) ?? {
            currentPassed: 0,
            currentTotal: 0,
            previousPassed: 0,
            previousTotal: 0,
          };

          if (executionDate >= currentWindowStart && executionDate <= currentWindowEnd) {
            regressionEntry.currentTotal += 1;
            regressionEntry.currentPassed += evaluation.passed ? 1 : 0;
          } else if (executionDate >= previousWindowStart && executionDate <= previousWindowEnd) {
            regressionEntry.previousTotal += 1;
            regressionEntry.previousPassed += evaluation.passed ? 1 : 0;
          }

          regressionTotals.set(evaluation.evaluatorName, regressionEntry);
        });
      });
    });

    const evaluatorNames = Array.from(evaluatorSet).sort((a, b) => a.localeCompare(b));

    const passRateData: PassRatePoint[] = Array.from(dailyEvaluations.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([day, totals]) => ({
        day: format(parseISO(day), 'MMM d'),
        rates: evaluatorNames.reduce<Record<string, number | null>>((acc, evaluatorName) => {
          const result = totals.get(evaluatorName);
          acc[evaluatorName] = result ? getPassRate(result.passed, result.total) : null;
          return acc;
        }, {}),
      }));

    const confidenceData = CONFIDENCE_BUCKETS.map((bucket) => {
      const totals = confidenceBuckets.get(bucket.label) ?? { passed: 0, failed: 0, total: 0 };
      return {
        bucket: bucket.label,
        passed: totals.passed,
        failed: totals.failed,
        total: totals.total,
      };
    });

    const alerts: RegressionAlert[] = Array.from(regressionTotals.entries())
      .map(([evaluatorName, totals]) => {
        const oldRate = totals.previousTotal > 0 ? getPassRate(totals.previousPassed, totals.previousTotal) : 0;
        const newRate = totals.currentTotal > 0 ? getPassRate(totals.currentPassed, totals.currentTotal) : 0;
        const delta = newRate - oldRate;
        const severity: RegressionAlert['severity'] = delta <= -20 ? 'error' : 'warning';
        return {
          evaluatorName,
          oldRate,
          newRate,
          delta,
          severity,
        };
      })
      .filter((alert) => alert.delta < -10)
      .sort((left, right) => left.delta - right.delta);

    return { evaluatorNames, passRateData, confidenceData, alerts };
  }, [executions]);

  const [visibleEvaluators, setVisibleEvaluators] = useState<Set<string> | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeEvaluators = visibleEvaluators ?? new Set(evaluatorNames);

  function toggleEvaluator(name: string) {
    setVisibleEvaluators(prev => {
      const current = prev ?? new Set(evaluatorNames);
      const next = new Set(current);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  function selectAll() {
    setVisibleEvaluators(null);
  }

  function selectNone() {
    setVisibleEvaluators(new Set());
  }

  return (
    <section className="space-y-6 p-4 md:p-6">
      {/* Regression alerts as table */}
      <div
        className="rounded-2xl border p-5"
        style={{
          borderColor: alerts.length > 0 ? 'var(--ds-status-error-muted)' : 'var(--ds-border-secondary)',
          backgroundColor: 'var(--ds-bg-secondary)',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
              Regression Alerts
            </h2>
            {alerts.length > 0 && (
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: 'var(--ds-status-error-bg)', color: 'var(--ds-status-error)' }}
              >
                {alerts.length} detected
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>vs. previous 7 days</p>
        </div>

        {alerts.length > 0 ? (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--ds-border-secondary)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ds-bg-tertiary)' }}>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ds-text-muted)' }}>Evaluator</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ds-text-muted)' }}>Previous</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ds-text-muted)' }}>Current</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ds-text-muted)' }}>Delta</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ds-text-muted)' }}>Severity</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => {
                  const isCritical = alert.severity === 'error';
                  return (
                    <tr
                      key={alert.evaluatorName}
                      className="border-t"
                      style={{ borderColor: 'var(--ds-border-secondary)' }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--ds-text-primary)' }}>{alert.evaluatorName}</td>
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--ds-text-secondary)' }}>{percent(alert.oldRate)}</td>
                      <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--ds-text-secondary)' }}>{percent(alert.newRate)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold" style={{ color: isCritical ? 'var(--ds-status-error)' : 'var(--ds-status-warning)' }}>
                        {alert.delta > 0 ? '+' : ''}{percent(alert.delta)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            backgroundColor: isCritical ? 'var(--ds-status-error-bg)' : 'var(--ds-status-warning-bg)',
                            color: isCritical ? 'var(--ds-status-error)' : 'var(--ds-status-warning)',
                          }}
                        >
                          {alert.severity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--ds-text-muted)' }}>
            ✓ No evaluator regressions greater than 10% in the current window.
          </p>
        )}
      </div>

      {/* Confidence Distribution */}
      <div className="rounded-2xl border p-4" style={cardStyle}>
        <div className="mb-4">
          <h3 className="text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>Confidence Distribution</h3>
          <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Histogram of confidence buckets split by pass and fail outcomes.</p>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={confidenceData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="bucket"
              tick={{ fill: 'var(--ds-text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'var(--ds-text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'var(--ds-text-secondary)' }}
              labelFormatter={(label) => `Confidence ${label}`}
            />
            <Bar dataKey="passed" name="passed" fill="var(--ds-status-success)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="failed" name="failed" fill="var(--ds-status-error)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pass Rate Over Time — at bottom */}
      <div className="rounded-2xl border p-4" style={cardStyle}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>Pass Rate Over Time</h3>
            <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Grouped by day across all step evaluations.</p>
          </div>

          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ borderColor: 'var(--ds-border-primary)', color: 'var(--ds-text-secondary)', backgroundColor: 'var(--ds-bg-tertiary)' }}
            >
              {activeEvaluators.size === evaluatorNames.length
                ? 'All evaluators'
                : `${activeEvaluators.size} of ${evaluatorNames.length}`}
              <svg className={`h-3 w-3 transition-transform ${filterOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 5l3 3 3-3" />
              </svg>
            </button>

            {filterOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border p-2 shadow-xl"
                style={{ borderColor: 'var(--ds-border-primary)', backgroundColor: 'var(--ds-bg-secondary)' }}
              >
                <div className="mb-2 flex gap-2 border-b pb-2" style={{ borderColor: 'var(--ds-border-secondary)' }}>
                  <button onClick={selectAll} className="text-[11px] font-medium" style={{ color: 'var(--ds-text-link)' }}>All</button>
                  <button onClick={selectNone} className="text-[11px] font-medium" style={{ color: 'var(--ds-text-link)' }}>None</button>
                </div>
                <div className="space-y-0.5 max-h-48 overflow-y-auto">
                  {evaluatorNames.map((name, index) => {
                    const isActive = activeEvaluators.has(name);
                    return (
                      <button
                        key={name}
                        onClick={() => toggleEvaluator(name)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:opacity-80"
                        style={{ backgroundColor: isActive ? 'var(--ds-bg-tertiary)' : 'transparent', color: 'var(--ds-text-primary)' }}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-sm border"
                          style={{
                            borderColor: EVALUATOR_COLORS[index % EVALUATOR_COLORS.length],
                            backgroundColor: isActive ? EVALUATOR_COLORS[index % EVALUATOR_COLORS.length] : 'transparent',
                          }}
                        />
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {passRateData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={passRateData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="day"
                tick={{ fill: 'var(--ds-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: 'var(--ds-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: 'var(--ds-text-secondary)' }}
              />
              {evaluatorNames.map((evaluatorName, index) => (
                <Line
                  key={evaluatorName}
                  type="monotone"
                  name={evaluatorName}
                  dataKey={(point: PassRatePoint) => point.rates[evaluatorName] ?? null}
                  stroke={EVALUATOR_COLORS[index % EVALUATOR_COLORS.length]}
                  strokeWidth={2.5}
                  unit="%"
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                  hide={!activeEvaluators.has(evaluatorName)}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed text-sm" style={{ borderColor: 'var(--ds-border-secondary)', color: 'var(--ds-text-muted)' }}>
            No evaluation data available yet.
          </div>
        )}
      </div>
    </section>
  );
}
