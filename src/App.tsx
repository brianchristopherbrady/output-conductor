import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, GitBranch, Activity, BarChart3, Search,
  Filter, ChevronDown, Workflow, CheckCircle2, XCircle, Loader2, DollarSign, Zap, Clock, Settings,
} from 'lucide-react';
import { useWorkflowData } from '@/hooks/useWorkflowData';
import { useDesignSystem } from '@/design-system';
import { HeroSection } from '@/components/dashboard/HeroSection';
import { ExecutionList } from '@/components/dashboard/ExecutionList';
import { ExecutionDetail } from '@/components/dashboard/ExecutionDetail';
import { TimelineView } from '@/components/timeline/TimelineView';
import { TracesView } from '@/components/traces/TracesView';
import { AnalyticsPanel } from '@/components/analytics/AnalyticsPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { ViewMode } from '@/types';
import { cn, formatCost, formatTokens, formatDuration } from '@/utils';

const NAV_ITEMS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Executions', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'timeline', label: 'Timeline', icon: <GitBranch className="h-5 w-5" /> },
  { id: 'traces', label: 'Traces', icon: <Activity className="h-5 w-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> },
];

export function App() {
  const {
    executions,
    allExecutions,
    costData,
    selectedExecution,
    selectExecution,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    workflowFilter,
    setWorkflowFilter,
    stats,
    workflowNames,
  } = useWorkflowData();

  const { theme, density } = useDesignSystem();
  const [filterOpen, setFilterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showHero, setShowHero] = useState(true);

  const runningCount = allExecutions.filter(e => e.status === 'running').length;
  const failedCount = allExecutions.filter(e => e.status === 'failed').length;

  if (showHero) {
    return (
      <div className="h-screen" style={{ backgroundColor: 'var(--ds-bg-app)' }}>
        <HeroSection onEnter={() => setShowHero(false)} />
      </div>
    );
  }

  return (
    <div
      className="flex h-screen flex-col overflow-hidden transition-colors duration-200"
      style={{ backgroundColor: 'var(--ds-bg-app)', color: 'var(--ds-text-primary)' }}
    >
      {/* Settings modal */}
      <AnimatePresence>
        {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
      </AnimatePresence>

      {/* Top bar */}
      <header
        className="border-b backdrop-blur-xl"
        style={{
          borderColor: 'var(--ds-border-secondary)',
          backgroundColor: 'var(--ds-bg-app)',
          padding: `var(--ds-header-padding)`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-conductor-500 to-conductor-700 p-2.5 shadow-lg shadow-conductor-500/20">
                <Workflow className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>Conductor</h1>
                <p className="text-sm" style={{ color: 'var(--ds-text-muted)' }}>Workflow Observatory for Output.ai</p>
              </div>
            </div>
          </div>

          {/* Search + filter + settings */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-64 rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-conductor-500/50 focus:outline-none focus:ring-2 focus:ring-conductor-500/20 transition-all"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                  filterOpen
                    ? 'border-conductor-500/40 bg-conductor-500/10 text-conductor-300'
                    : 'border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600',
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={cn('h-4 w-4 transition-transform', filterOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {filterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs uppercase tracking-wider text-zinc-500 mb-1.5 block font-medium">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-conductor-500/50"
                        >
                          <option value="all">All Statuses</option>
                          <option value="completed">Completed</option>
                          <option value="running">Running</option>
                          <option value="failed">Failed</option>
                          <option value="retrying">Retrying</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wider text-zinc-500 mb-1.5 block font-medium">Workflow</label>
                        <select
                          value={workflowFilter}
                          onChange={(e) => setWorkflowFilter(e.target.value)}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-conductor-500/50"
                        >
                          <option value="all">All Workflows</option>
                          {workflowNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Settings button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-xl border p-2.5 transition-all hover:opacity-80"
              style={{
                borderColor: 'var(--ds-border-primary)',
                color: 'var(--ds-text-tertiary)',
                backgroundColor: 'var(--ds-bg-secondary)',
              }}
              title="Appearance settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats bar + Nav */}
        <div className="mt-4 flex items-center justify-between">
          {/* Quick stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" style={{ color: 'var(--ds-status-success)' }} />
              <span className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--ds-status-success)' }}>{(stats.successRate * 100).toFixed(0)}%</span> success rate
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className={cn("h-4 w-4", runningCount > 0 && "animate-spin")} style={{ color: 'var(--ds-status-info)' }} />
              <span className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--ds-status-info)' }}>{runningCount}</span> running
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4" style={{ color: 'var(--ds-status-error)' }} />
              <span className="text-sm" style={{ color: 'var(--ds-text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--ds-status-error)' }}>{failedCount}</span> failed
              </span>
            </div>
            <div className="h-4 w-px" style={{ backgroundColor: 'var(--ds-border-primary)' }} />
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" style={{ color: 'var(--ds-text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--ds-text-tertiary)' }}>
                {formatCost(stats.totalCost)} spent
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" style={{ color: 'var(--ds-text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--ds-text-tertiary)' }}>
                {formatTokens(stats.totalTokens)} tokens
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: 'var(--ds-text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--ds-text-tertiary)' }}>
                ~{formatDuration(stats.avgDuration)} avg
              </span>
            </div>
          </div>

          {/* Nav tabs */}
          <nav
            className="flex items-center gap-1 rounded-xl border p-1"
            style={{ backgroundColor: 'var(--ds-nav-bg)', borderColor: 'var(--ds-border-secondary)' }}
          >
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setViewMode(item.id)}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
                style={{
                  backgroundColor: viewMode === item.id ? 'var(--ds-nav-active)' : 'transparent',
                  color: viewMode === item.id ? 'var(--ds-nav-active-text)' : 'var(--ds-text-muted)',
                }}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden" style={{ backgroundColor: 'var(--ds-bg-primary)' }}>
        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 overflow-hidden"
            >
              {/* Execution list */}
              <div
                className={cn(
                  'flex flex-col overflow-hidden border-r transition-all',
                  selectedExecution ? 'w-1/2' : 'w-full max-w-5xl mx-auto',
                )}
                style={{ borderColor: 'var(--ds-border-secondary)' }}
              >
                <div
                  className="px-6 py-3 border-b flex items-center justify-between"
                  style={{ borderColor: 'var(--ds-border-secondary)' }}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--ds-text-tertiary)' }}>
                    {executions.length} workflow executions
                  </p>
                  <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Click any execution to inspect</p>
                </div>
                <ExecutionList
                  executions={executions}
                  selectedId={selectedExecution?.id}
                  onSelect={selectExecution}
                />
              </div>

              {/* Detail panel */}
              <AnimatePresence>
                {selectedExecution && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '50%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ExecutionDetail
                      execution={selectedExecution}
                      onClose={() => selectExecution(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {viewMode === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden"
            >
              <TimelineView executions={executions} onSelect={selectExecution} />
            </motion.div>
          )}

          {viewMode === 'traces' && (
            <motion.div
              key="traces"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden"
            >
              <TracesView executions={executions} />
            </motion.div>
          )}

          {viewMode === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden"
            >
              <AnalyticsPanel executions={allExecutions} costData={costData} stats={stats} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
