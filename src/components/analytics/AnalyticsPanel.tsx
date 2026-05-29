import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, DollarSign, Zap, Activity } from 'lucide-react';
import { WorkflowExecution, CostBreakdown } from '@/types';
import { MetricCard } from '@/components/shared/StatusBadge';
import { formatCost, formatTokens } from '@/utils';
import { CostHeatmap } from './CostHeatmap';

interface AnalyticsPanelProps {
  executions: WorkflowExecution[];
  costData: CostBreakdown[];
  stats: {
    totalExecutions: number;
    successRate: number;
    avgDuration: number;
    totalCost: number;
    totalTokens: number;
  };
}

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];

export function AnalyticsPanel({ executions, costData, stats }: AnalyticsPanelProps) {
  const workflowDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    executions.forEach(e => {
      counts[e.workflowName] = (counts[e.workflowName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [executions]);

  const providerDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    executions.forEach(e => {
      counts[e.provider] = (counts[e.provider] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [executions]);

  const cardStyle = {
    borderColor: 'var(--ds-card-border)',
    backgroundColor: 'var(--ds-card-bg)',
  };

  const tooltipStyle = {
    background: 'var(--ds-tooltip-bg)',
    border: '1px solid var(--ds-border-primary)',
    borderRadius: '8px',
    color: 'var(--ds-tooltip-text)',
  };

  return (
    <div className="space-y-6 p-4 overflow-auto h-full">
      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Executions"
          value={stats.totalExecutions.toLocaleString()}
          subvalue="+12% vs last week"
          icon={<Activity className="h-5 w-5" />}
          trend="up"
        />
        <MetricCard
          label="Success Rate"
          value={`${(stats.successRate * 100).toFixed(1)}%`}
          subvalue="+2.3% vs last week"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
        />
        <MetricCard
          label="Total Cost"
          value={formatCost(stats.totalCost)}
          subvalue="-8% vs last week"
          icon={<DollarSign className="h-5 w-5" />}
          trend="down"
        />
        <MetricCard
          label="Total Tokens"
          value={formatTokens(stats.totalTokens)}
          subvalue={`~${formatTokens(stats.totalTokens / stats.totalExecutions)}/exec`}
          icon={<Zap className="h-5 w-5" />}
          trend="neutral"
        />
      </div>

      {/* Cost over time chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border p-4"
        style={cardStyle}
      >
        <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>Cost Over Time</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={costData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-border-secondary)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--ds-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--ds-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--ds-text-secondary)' }} />
            <Area type="monotone" dataKey="inputCost" stroke="#6366f1" fill="url(#colorInput)" name="Input Cost" />
            <Area type="monotone" dataKey="outputCost" stroke="#10b981" fill="url(#colorOutput)" name="Output Cost" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Cost Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <CostHeatmap costData={costData} />
      </motion.div>

      {/* Bottom charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Workflow distribution */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border p-4"
          style={cardStyle}
        >
          <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>Workflow Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={workflowDistribution} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-border-secondary)" horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--ds-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--ds-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Provider breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border p-4"
          style={cardStyle}
        >
          <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>Provider Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={providerDistribution}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {providerDistribution.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Executions per day */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border p-4"
        style={cardStyle}
      >
        <h3 className="mb-4 text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>Daily Executions</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={costData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ds-border-secondary)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--ds-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--ds-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="executions" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Executions" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
