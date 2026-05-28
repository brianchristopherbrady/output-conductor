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
        className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
      >
        <h3 className="mb-4 text-sm font-medium text-zinc-300">Cost Over Time</h3>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
              labelStyle={{ color: '#a1a1aa' }}
            />
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
        className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
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
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
        >
          <h3 className="mb-4 text-sm font-medium text-zinc-300">Workflow Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={workflowDistribution} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Provider breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
        >
          <h3 className="mb-4 text-sm font-medium text-zinc-300">Provider Breakdown</h3>
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
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Executions per day */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
      >
        <h3 className="mb-4 text-sm font-medium text-zinc-300">Daily Executions</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={costData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
            />
            <Bar dataKey="executions" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Executions" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
