import { useMemo } from 'react';
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

  return (
    <section className="space-y-6 p-4 md:p-6">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
          Evaluation Trends
        </h2>
        <p className="text-sm" style={{ color: 'var(--ds-text-tertiary)' }}>
          Daily evaluator performance, confidence patterns, and quality regressions.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border p-4" style={cardStyle}>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>Pass Rate Over Time</h3>
              <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Grouped by day across all step evaluations.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {evaluatorNames.map((name, index) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1"
                  style={{
                    borderColor: 'var(--ds-border-secondary)',
                    backgroundColor: 'var(--ds-bg-secondary)',
                    color: 'var(--ds-text-secondary)',
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: EVALUATOR_COLORS[index % EVALUATOR_COLORS.length] }}
                  />
                  {name}
                </span>
              ))}
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

        <div className="rounded-2xl border p-4" style={cardStyle}>
          <div className="mb-4">
            <h3 className="text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>Confidence Distribution</h3>
            <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Histogram of confidence buckets split by pass and fail outcomes.</p>
          </div>

          <ResponsiveContainer width="100%" height={280}>
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
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>Quality Regression Alerts</h3>
          <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Comparing the last 7 days with the previous 7 day period.</p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {alerts.length > 0 ? alerts.map((alert) => {
            const isCritical = alert.severity === 'error';
            return (
              <article
                key={alert.evaluatorName}
                className="min-w-[240px] flex-1 rounded-2xl border p-4"
                style={{
                  borderColor: isCritical ? 'var(--ds-status-error-muted)' : 'var(--ds-status-warning-muted)',
                  backgroundColor: isCritical ? 'var(--ds-status-error-bg)' : 'var(--ds-status-warning-bg)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: isCritical ? 'var(--ds-status-error)' : 'var(--ds-status-warning)' }}>
                      {alert.evaluatorName}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
                      Pass rate dropped by {percent(Math.abs(alert.delta))}
                    </p>
                  </div>
                  <span
                    className="rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
                    style={{
                      borderColor: isCritical ? 'var(--ds-status-error-muted)' : 'var(--ds-status-warning-muted)',
                      color: isCritical ? 'var(--ds-status-error)' : 'var(--ds-status-warning)',
                    }}
                  >
                    {isCritical ? 'Critical' : 'Warning'}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt style={{ color: 'var(--ds-text-muted)' }}>Previous</dt>
                    <dd className="mt-1 font-medium" style={{ color: 'var(--ds-text-primary)' }}>{percent(alert.oldRate)}</dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--ds-text-muted)' }}>Current</dt>
                    <dd className="mt-1 font-medium" style={{ color: 'var(--ds-text-primary)' }}>{percent(alert.newRate)}</dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--ds-text-muted)' }}>Delta</dt>
                    <dd className="mt-1 font-medium" style={{ color: isCritical ? 'var(--ds-status-error)' : 'var(--ds-status-warning)' }}>
                      {percent(alert.delta)}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          }) : (
            <div className="w-full rounded-2xl border border-dashed px-4 py-5 text-sm" style={{ borderColor: 'var(--ds-border-secondary)', color: 'var(--ds-text-muted)', backgroundColor: 'var(--ds-bg-secondary)' }}>
              No evaluator regressions greater than 10% detected in the last comparison window.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
