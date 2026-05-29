import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, GitBranch, Activity, BarChart3, Search,
  Filter, ChevronDown, Workflow, CheckCircle2, XCircle, Loader2, DollarSign, Zap, Clock, Settings, Route,
  GitCompare, Radio, BookOpen,
} from 'lucide-react';
import { useWorkflowData } from '@/hooks/useWorkflowData';
import { useLiveMode } from '@/hooks/useLiveMode';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDesignSystem } from '@/design-system';
import { HeroSection } from '@/components/dashboard/HeroSection';
import { ExecutionList } from '@/components/dashboard/ExecutionList';
import { ExecutionDetail } from '@/components/dashboard/ExecutionDetail';
import { TimelineView } from '@/components/timeline/TimelineView';
import { TracesView } from '@/components/traces/TracesView';
import { AnalyticsPanel } from '@/components/analytics/AnalyticsPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { FlowGraph } from '@/components/flow/FlowGraph';
import { PromptDiffViewer } from '@/components/diff/PromptDiffViewer';
import { EvalTrends } from '@/components/analytics/EvalTrends';
import { ShowcasePage } from '@/components/showcase/ShowcasePage';
import { CommandPalette, CommandAction } from '@/components/shared/CommandPalette';
import { ToastNotification } from '@/components/shared/ToastNotification';
import { ShortcutsHelp } from '@/components/shared/ShortcutsHelp';
import { ViewMode } from '@/types';
import { cn, formatCost, formatTokens, formatDuration } from '@/utils';

const NAV_ITEMS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Executions', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
  { id: 'flow', label: 'States', icon: <Route className="h-3.5 w-3.5" /> },
  { id: 'timeline', label: 'Timeline', icon: <GitBranch className="h-3.5 w-3.5" /> },
  { id: 'traces', label: 'Traces', icon: <Activity className="h-3.5 w-3.5" /> },
  { id: 'diff', label: 'Diff', icon: <GitCompare className="h-3.5 w-3.5" /> },
  { id: 'insights', label: 'Insights', icon: <BarChart3 className="h-3.5 w-3.5" /> },
  { id: 'showcase', label: 'About', icon: <BookOpen className="h-3.5 w-3.5" /> },
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
  const { isLive, toggleLive, events: liveEvents } = useLiveMode();
  const [filterOpen, setFilterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showHero, setShowHero] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  const runningCount = allExecutions.filter(e => e.status === 'running').length;
  const failedCount = allExecutions.filter(e => e.status === 'failed').length;

  // Command palette action handler
  const handleCommandAction = useCallback((action: CommandAction) => {
    setCommandPaletteOpen(false);
    if (action.type === 'navigate') {
      setViewMode(action.value);
    } else if (action.type === 'filter') {
      setWorkflowFilter(action.value);
      setViewMode('dashboard');
    } else if (action.type === 'action') {
      if (action.value === 'toggle-theme') {
        // handled by design system
      } else if (action.value === 'toggle-live') {
        toggleLive();
      } else if (action.value === 'settings') {
        setSettingsOpen(true);
      }
    }
  }, [setViewMode, setWorkflowFilter, toggleLive]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onOpenCommandPalette: () => setCommandPaletteOpen(true),
    onShowHelp: () => setShortcutsHelpOpen(true),
    onBack: () => {
      if (settingsOpen) setSettingsOpen(false);
      else if (selectedExecution) selectExecution(null);
    },
    onToggleLive: toggleLive,
    onOpenSettings: () => setSettingsOpen(true),
    onGoToDashboard: () => setViewMode('dashboard'),
    onGoToFlow: () => setViewMode('flow'),
    onGoToTimeline: () => setViewMode('timeline'),
    onGoToTraces: () => setViewMode('traces'),
    onGoToDiff: () => setViewMode('diff'),
    onGoToInsights: () => setViewMode('insights'),
    onGoToShowcase: () => setViewMode('showcase'),
  });

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

      {/* Command palette */}
      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} onAction={handleCommandAction} />

      {/* Shortcuts help */}
      <ShortcutsHelp open={shortcutsHelpOpen} onClose={() => setShortcutsHelpOpen(false)} />

      {/* Toast notifications (live mode) */}
      <ToastNotification events={liveEvents} />

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
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-gradient-to-br from-conductor-500 to-conductor-700 p-1.5 shadow-md shadow-conductor-500/20">
                <Workflow className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>Conductor</h1>
                <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>Meridian Health • Output.ai</p>
              </div>
            </div>
          </div>

          {/* Search + filter + settings */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border pl-8 pr-3 text-xs placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-conductor-500/20 transition-all"
                style={{
                  height: 'var(--ds-input-height)',
                  width: '200px',
                  borderColor: 'var(--ds-input-border)',
                  backgroundColor: 'var(--ds-input-bg)',
                  color: 'var(--ds-text-primary)',
                }}
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                  filterOpen
                    ? 'border-conductor-500/40 bg-conductor-500/10 text-conductor-300'
                    : 'text-zinc-400 hover:text-zinc-200',
                )}
                style={{ borderColor: filterOpen ? undefined : 'var(--ds-input-border)' }}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                <ChevronDown className={cn('h-3 w-3 transition-transform', filterOpen && 'rotate-180')} />
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

            {/* Live mode toggle */}
            <button
              onClick={toggleLive}
              className={cn(
                'rounded-lg border p-1.5 transition-all',
                isLive ? 'border-green-500/40 bg-green-500/10' : 'hover:opacity-80',
              )}
              style={{
                borderColor: isLive ? undefined : 'var(--ds-border-primary)',
                color: isLive ? 'rgb(34,197,94)' : 'var(--ds-text-tertiary)',
                backgroundColor: isLive ? undefined : 'var(--ds-bg-secondary)',
              }}
              title={isLive ? 'Live mode ON (L)' : 'Live mode OFF (L)'}
            >
              <Radio className={cn('h-4 w-4', isLive && 'animate-pulse')} />
            </button>

            {/* Settings button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg border p-1.5 transition-all hover:opacity-80"
              style={{
                borderColor: 'var(--ds-border-primary)',
                color: 'var(--ds-text-tertiary)',
                backgroundColor: 'var(--ds-bg-secondary)',
              }}
              title="Appearance settings (S)"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats bar + Nav */}
        <div className="mt-2.5 flex items-center justify-between">
          {/* Quick stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--ds-status-success)' }} />
              <span className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--ds-status-success)' }}>{(stats.successRate * 100).toFixed(0)}%</span> success
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Loader2 className={cn("h-3.5 w-3.5", runningCount > 0 && "animate-spin")} style={{ color: 'var(--ds-status-info)' }} />
              <span className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--ds-status-info)' }}>{runningCount}</span> running
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5" style={{ color: 'var(--ds-status-error)' }} />
              <span className="text-xs" style={{ color: 'var(--ds-text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--ds-status-error)' }}>{failedCount}</span> failed
              </span>
            </div>
            <div className="h-3 w-px" style={{ backgroundColor: 'var(--ds-border-primary)' }} />
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" style={{ color: 'var(--ds-text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--ds-text-tertiary)' }}>
                {formatCost(stats.totalCost)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" style={{ color: 'var(--ds-text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--ds-text-tertiary)' }}>
                {formatTokens(stats.totalTokens)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" style={{ color: 'var(--ds-text-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--ds-text-tertiary)' }}>
                ~{formatDuration(stats.avgDuration)} avg
              </span>
            </div>
          </div>

          {/* Nav tabs */}
          <nav
            className="flex items-center gap-0.5 rounded-lg border p-0.5"
            style={{ backgroundColor: 'var(--ds-nav-bg)', borderColor: 'var(--ds-border-secondary)' }}
          >
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setViewMode(item.id)}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all"
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
              className="flex-1 overflow-auto"
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
              className="flex-1 overflow-auto"
            >
              <TracesView executions={executions} />
            </motion.div>
          )}

          {viewMode === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-auto"
            >
              <EvalTrends executions={allExecutions} />
              <AnalyticsPanel executions={allExecutions} costData={costData} stats={stats} />
            </motion.div>
          )}

          {viewMode === 'flow' && (
            <motion.div
              key="flow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-hidden"
            >
              <FlowGraph
                executions={executions}
                selectedExecution={selectedExecution}
                onSelectExecution={selectExecution}
              />
            </motion.div>
          )}

          {viewMode === 'diff' && (
            <motion.div
              key="diff"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-auto p-4"
            >
              <PromptDiffViewer executions={allExecutions} />
            </motion.div>
          )}

          {viewMode === 'showcase' && (
            <motion.div
              key="showcase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-auto"
            >
              <ShowcasePage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
