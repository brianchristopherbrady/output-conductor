import { useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import type { CostBreakdown } from '@/types';
import { formatCost, formatTokens } from '@/utils';

interface CostHeatmapProps {
  costData: CostBreakdown[];
  onSelectDay?: (date: string) => void;
}

interface HeatmapDay {
  date: string;
  day: Date;
  totalCost: number;
  totalTokens: number;
  executions: number;
  weekIndex: number;
  dayIndex: number;
  x: number;
  y: number;
}

interface HoveredDay {
  date: string;
  totalCost: number;
  totalTokens: number;
  executions: number;
  x: number;
  y: number;
}

const CELL_SIZE = 12;
const CELL_GAP = 2;
const CELL_STEP = CELL_SIZE + CELL_GAP;
const DAY_LABEL_WIDTH = 30;
const MONTH_LABEL_HEIGHT = 18;
const GRID_TOP_OFFSET = MONTH_LABEL_HEIGHT + 8;
const LEGEND_LEVELS = [0.1, 0.3, 0.5, 0.7, 1] as const;
const EMPTY_COLOR = 'rgba(34,197,94, 0.06)';
const WEEKDAY_LABELS = [
  { label: 'Mon', dayIndex: 0 },
  { label: 'Wed', dayIndex: 2 },
  { label: 'Fri', dayIndex: 4 },
] as const;

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatDayLabel(value: string): string {
  return parseLocalDate(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date);
  const mondayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - mondayOffset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getDayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function getHeatLevel(value: number, maxValue: number): string {
  if (value <= 0 || maxValue <= 0) return EMPTY_COLOR;

  const ratio = value / maxValue;
  if (ratio <= 0.2) return `rgba(34,197,94, ${LEGEND_LEVELS[0]})`;
  if (ratio <= 0.4) return `rgba(34,197,94, ${LEGEND_LEVELS[1]})`;
  if (ratio <= 0.6) return `rgba(34,197,94, ${LEGEND_LEVELS[2]})`;
  if (ratio <= 0.8) return `rgba(34,197,94, ${LEGEND_LEVELS[3]})`;
  return `rgba(34,197,94, ${LEGEND_LEVELS[4]})`;
}

export function CostHeatmap({ costData, onSelectDay }: CostHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredDay, setHoveredDay] = useState<HoveredDay | null>(null);

  const { days, monthLabels, totalCost, avgDailyCost, peakDay, maxCost, svgWidth, svgHeight } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rangeStart = new Date(today);
    rangeStart.setDate(today.getDate() - 83);
    rangeStart.setHours(0, 0, 0, 0);

    const rangeStartWeek = getStartOfWeek(rangeStart);
    const byDate = new Map(costData.map((entry) => [entry.date, entry]));
    const heatmapDays: HeatmapDay[] = [];
    const labels: Array<{ label: string; x: number }> = [];
    let currentMonth = '';

    for (let offset = 0; offset < 84; offset += 1) {
      const day = new Date(rangeStart);
      day.setDate(rangeStart.getDate() + offset);
      day.setHours(0, 0, 0, 0);

      const date = `${day.getFullYear()}-${`${day.getMonth() + 1}`.padStart(2, '0')}-${`${day.getDate()}`.padStart(2, '0')}`;
      const entry = byDate.get(date);
      const weekIndex = Math.floor((getStartOfWeek(day).getTime() - rangeStartWeek.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const dayIndex = getDayIndex(day);
      const x = DAY_LABEL_WIDTH + weekIndex * CELL_STEP;
      const y = GRID_TOP_OFFSET + dayIndex * CELL_STEP;

      if (currentMonth !== `${day.getFullYear()}-${day.getMonth()}`) {
        currentMonth = `${day.getFullYear()}-${day.getMonth()}`;
        labels.push({
          label: day.toLocaleDateString(undefined, { month: 'short' }),
          x,
        });
      }

      heatmapDays.push({
        date,
        day,
        totalCost: entry?.totalCost ?? 0,
        totalTokens: entry?.totalTokens ?? 0,
        executions: entry?.executions ?? 0,
        weekIndex,
        dayIndex,
        x,
        y,
      });
    }

    const costs = heatmapDays.map((day) => day.totalCost);
    const computedTotalCost = costs.reduce((sum, value) => sum + value, 0);
    const computedPeakDay = heatmapDays.reduce<HeatmapDay | null>((peak, day) => {
      if (!peak || day.totalCost > peak.totalCost) return day;
      return peak;
    }, null);
    const maxWeekIndex = heatmapDays.reduce((max, day) => Math.max(max, day.weekIndex), 0);

    return {
      days: heatmapDays,
      monthLabels: labels,
      totalCost: computedTotalCost,
      avgDailyCost: computedTotalCost / heatmapDays.length,
      peakDay: computedPeakDay,
      maxCost: Math.max(...costs, 0),
      svgWidth: DAY_LABEL_WIDTH + (maxWeekIndex + 1) * CELL_STEP,
      svgHeight: GRID_TOP_OFFSET + 7 * CELL_STEP,
    };
  }, [costData]);

  const handleHover = (event: ReactMouseEvent<SVGRectElement>, day: HeatmapDay) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();

    if (!containerRect) return;

    setHoveredDay({
      date: day.date,
      totalCost: day.totalCost,
      totalTokens: day.totalTokens,
      executions: day.executions,
      x: targetRect.left - containerRect.left + targetRect.width / 2,
      y: targetRect.top - containerRect.top - 8,
    });
  };

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: 'var(--ds-border-primary)',
        backgroundColor: 'var(--ds-bg-secondary)',
        color: 'var(--ds-text-primary)',
      }}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium">Cost Heatmap</h3>
          <p className="mt-1 text-xs" style={{ color: 'var(--ds-text-muted)' }}>
            Last 12 weeks of model spend activity
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-right sm:grid-cols-3 sm:gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--ds-text-muted)' }}>Total cost</div>
            <div className="text-sm font-semibold">{formatCost(totalCost)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--ds-text-muted)' }}>Avg daily</div>
            <div className="text-sm font-semibold">{formatCost(avgDailyCost)}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--ds-text-muted)' }}>Peak day</div>
            <div className="text-sm font-semibold">
              {peakDay ? `${formatCost(peakDay.totalCost)} · ${formatDayLabel(peakDay.date)}` : '—'}
            </div>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative overflow-x-auto">
        {hoveredDay && (
          <div
            className="pointer-events-none absolute z-10 rounded-md border px-2 py-1.5 text-[11px] shadow-lg"
            style={{
              left: hoveredDay.x,
              top: hoveredDay.y,
              transform: 'translate(-50%, -100%)',
              borderColor: 'var(--ds-border-primary)',
              backgroundColor: 'var(--ds-bg-tertiary)',
              color: 'var(--ds-text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            <div className="font-medium">{formatDayLabel(hoveredDay.date)}</div>
            <div style={{ color: 'var(--ds-text-muted)' }}>{formatCost(hoveredDay.totalCost)} cost</div>
            <div style={{ color: 'var(--ds-text-muted)' }}>{formatTokens(hoveredDay.totalTokens)} tokens</div>
            <div style={{ color: 'var(--ds-text-muted)' }}>{hoveredDay.executions.toLocaleString()} executions</div>
          </div>
        )}

        <svg width={svgWidth} height={svgHeight} className="block min-w-full overflow-visible">
          {monthLabels.map((month) => (
            <text
              key={`${month.label}-${month.x}`}
              x={month.x}
              y={12}
              fontSize={11}
              fill="var(--ds-text-muted)"
            >
              {month.label}
            </text>
          ))}

          {WEEKDAY_LABELS.map(({ label, dayIndex }) => (
            <text
              key={label}
              x={0}
              y={GRID_TOP_OFFSET + dayIndex * CELL_STEP + CELL_SIZE - 1}
              fontSize={11}
              fill="var(--ds-text-muted)"
            >
              {label}
            </text>
          ))}

          {days.map((day) => {
            const fill = getHeatLevel(day.totalCost, maxCost);
            const isInteractive = Boolean(onSelectDay);

            return (
              <rect
                key={day.date}
                x={day.x}
                y={day.y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={2}
                fill={fill}
                stroke="var(--ds-border-primary)"
                strokeWidth={0.5}
                style={{ cursor: isInteractive ? 'pointer' : 'default' }}
                onMouseEnter={(event) => handleHover(event, day)}
                onMouseMove={(event) => handleHover(event, day)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => onSelectDay?.(day.date)}
                aria-label={`${formatDayLabel(day.date)} ${formatCost(day.totalCost)} ${day.executions} executions`}
              />
            );
          })}
        </svg>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-[11px]" style={{ color: 'var(--ds-text-muted)' }}>
        <span>Less</span>
        <div className="flex items-center gap-1">
          <span
            className="inline-block rounded-sm"
            style={{ width: CELL_SIZE, height: CELL_SIZE, backgroundColor: EMPTY_COLOR, border: '1px solid var(--ds-border-primary)' }}
          />
          {LEGEND_LEVELS.map((level) => (
            <span
              key={level}
              className="inline-block rounded-sm"
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: `rgba(34,197,94, ${level})`,
                border: '1px solid var(--ds-border-primary)',
              }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
