import { motion } from 'framer-motion';
import {
  Workflow, Route, GitBranch, Activity, BarChart3, GitCompare, TrendingUp,
  Radio, Command, Keyboard, Palette, Layers, Gauge, Eye, Sparkles, Code2,
  Monitor, Zap,
} from 'lucide-react';

const FEATURES = [
  {
    icon: <Workflow className="h-5 w-5" />,
    title: 'Virtualized Execution List',
    description: 'Browse 500+ workflow executions with buttery-smooth scroll. TanStack Virtual renders only visible rows for constant performance regardless of dataset size.',
    tags: ['@tanstack/react-virtual', 'Performance', '60fps'],
  },
  {
    icon: <Route className="h-5 w-5" />,
    title: 'Pipeline Flow Graph',
    description: 'SVG-based directed acyclic graph showing workflow steps as connected nodes. Animated particles flow along edges in real-time. Select a run to hydrate the template with execution state.',
    tags: ['SVG', 'Animation', 'requestAnimationFrame'],
  },
  {
    icon: <GitBranch className="h-5 w-5" />,
    title: 'Timeline Swimlanes',
    description: 'Temporal view of concurrent step execution with proportional-width bars. Instant visual feedback on parallelism bottlenecks and step ordering.',
    tags: ['Data Visualization', 'Temporal'],
  },
  {
    icon: <GitCompare className="h-5 w-5" />,
    title: 'Prompt Diff Viewer',
    description: 'LCS-based line diff comparing prompts and responses between workflow runs. Smart filtering ensures only compatible runs appear. Mini pipeline nav shows context.',
    tags: ['LCS Algorithm', 'Side-by-side', 'Comparison'],
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: 'Evaluation Trends',
    description: 'Per-evaluator pass rate over time with automated regression detection. Confidence distribution histograms. Alerts surface when quality drops >10% week-over-week.',
    tags: ['recharts', 'Regression Detection', 'Analytics'],
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Cost Heatmap',
    description: 'GitHub-contributions-style calendar showing daily API spend. Color intensity maps to cost magnitude. Hover for details, click to drill into any day.',
    tags: ['SVG Heatmap', 'Tooltips', 'Interactive'],
  },
  {
    icon: <Radio className="h-5 w-5" />,
    title: 'Live Mode',
    description: 'Simulated real-time workflow events with glass-morphism toast notifications. Events auto-dismiss and stack gracefully. Toggle with the L key or header button.',
    tags: ['Real-time', 'Toast System', 'framer-motion'],
  },
  {
    icon: <Command className="h-5 w-5" />,
    title: 'Command Palette',
    description: 'Ctrl+K opens a fuzzy-search command palette across views, workflows, and actions. Keyboard-navigable with arrow keys. Grouped results with shortcut hints.',
    tags: ['Fuzzy Search', 'Keyboard-first', 'Accessibility'],
  },
  {
    icon: <Keyboard className="h-5 w-5" />,
    title: 'Keyboard Shortcuts',
    description: 'Full keyboard navigation: j/k to traverse, 1-5 to switch views, L for live mode, S for settings, ? for help overlay. Input-aware (disabled when typing).',
    tags: ['Power Users', 'Accessibility', 'Global Listeners'],
  },
  {
    icon: <Palette className="h-5 w-5" />,
    title: 'Design System & Theming',
    description: 'Comprehensive token-based design system with 60+ semantic color tokens, 3 density modes (compact/comfortable/spacious), and light/dark themes. CSS custom properties for runtime switching.',
    tags: ['Design Tokens', 'CSS Variables', 'Theme Engine'],
  },
];

const TECH_STACK = [
  { name: 'React 19', role: 'UI Framework' },
  { name: 'TypeScript', role: 'Type Safety' },
  { name: 'Vite', role: 'Build Tool' },
  { name: 'Tailwind CSS 4', role: 'Utility Styles' },
  { name: 'Framer Motion', role: 'Animations' },
  { name: 'TanStack Virtual', role: 'Virtualization' },
  { name: 'Recharts', role: 'Data Charts' },
  { name: 'Lucide React', role: 'Icons' },
  { name: 'Vitest', role: 'Testing' },
  { name: 'date-fns', role: 'Date Utils' },
];

const DESIGN_DECISIONS = [
  {
    title: 'Template → State Pattern',
    description: 'The Flow view shows a neutral "template" of the pipeline first, then overlays execution state when a run is selected. This teaches users the workflow structure before layering on complexity.',
  },
  {
    title: 'Progressive Disclosure',
    description: 'Each view starts with a scannable overview (lists, graphs) and lets users drill into detail (sidebars, modals, inspectors) on demand. No information overload on first render.',
  },
  {
    title: 'Density as a First-Class Setting',
    description: 'Users monitoring dashboards all day need compact mode. Those presenting to stakeholders want spacious. Density affects every component through CSS custom properties — zero re-renders.',
  },
  {
    title: 'Keyboard-First, Mouse-Friendly',
    description: 'Every primary action is keyboard-accessible (navigation, search, mode switching). But the UI is fully mouse-driven too — shortcuts are progressive enhancement, not requirements.',
  },
  {
    title: 'Neutral Diff Semantics',
    description: 'Prompt diffs use amber/blue instead of red/green. Red/green implies "bad/good" or "error/success" — but diffs are neutral comparisons. Color meaning matters.',
  },
];

export function ShowcasePage() {
  return (
    <div className="overflow-auto h-full">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-conductor-500 to-conductor-700 p-2.5 shadow-lg shadow-conductor-500/20">
              <Workflow className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--ds-text-primary)' }}>
                Conductor
              </h1>
              <p className="text-sm" style={{ color: 'var(--ds-text-muted)' }}>
                A Visual Workflow Observatory for Output.ai
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--ds-text-secondary)' }}>
            Conductor is a design-engineering prototype demonstrating how complex AI workflow data
            can be presented through ergonomic, information-dense interfaces. Built as a portfolio piece
            for the Design Engineer role at Output.ai, it showcases interaction patterns, data visualization,
            and systems thinking applied to developer tooling.
          </p>
        </motion.header>

        {/* What This Demonstrates */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
            What This Demonstrates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { icon: <Eye className="h-4 w-4" />, label: 'Complex Data → Clear UI', desc: '500 executions, multi-level drill-down, zero overwhelm' },
              { icon: <Sparkles className="h-4 w-4" />, label: 'Polished Interactions', desc: 'Animated transitions, particles, keyboard nav, command palette' },
              { icon: <Code2 className="h-4 w-4" />, label: 'Systems Thinking', desc: 'Design tokens, theme engine, density configs, clean architecture' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border p-4 space-y-2"
                style={{ backgroundColor: 'var(--ds-bg-secondary)', borderColor: 'var(--ds-border-primary)' }}>
                <div className="flex items-center gap-2" style={{ color: 'var(--ds-text-primary)' }}>
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
            Features ({FEATURES.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="rounded-xl border p-4 space-y-2"
                style={{ backgroundColor: 'var(--ds-bg-secondary)', borderColor: 'var(--ds-border-primary)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg p-1.5" style={{ backgroundColor: 'var(--ds-bg-tertiary)', color: 'var(--ds-text-secondary)' }}>
                    {feature.icon}
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
                    {feature.title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ds-text-muted)' }}>
                  {feature.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {feature.tags.map(tag => (
                    <span key={tag} className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: 'var(--ds-bg-tertiary)', color: 'var(--ds-text-tertiary)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Design Decisions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
            Design Decisions
          </h2>
          <div className="space-y-3">
            {DESIGN_DECISIONS.map((decision, i) => (
              <div key={decision.title} className="rounded-xl border p-4"
                style={{ backgroundColor: 'var(--ds-bg-secondary)', borderColor: 'var(--ds-border-primary)' }}>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--ds-text-primary)' }}>
                  {decision.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ds-text-muted)' }}>
                  {decision.description}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Tech Stack */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
            Tech Stack
          </h2>
          <div className="flex flex-wrap gap-2">
            {TECH_STACK.map(tech => (
              <div key={tech.name} className="flex items-center gap-2 rounded-lg border px-3 py-2"
                style={{ backgroundColor: 'var(--ds-bg-secondary)', borderColor: 'var(--ds-border-primary)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--ds-text-primary)' }}>{tech.name}</span>
                <span className="text-[10px]" style={{ color: 'var(--ds-text-muted)' }}>{tech.role}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Architecture Note */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border p-5 space-y-3"
          style={{ backgroundColor: 'var(--ds-bg-secondary)', borderColor: 'var(--ds-border-primary)' }}
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" style={{ color: 'var(--ds-text-muted)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
              How This Maps to Output.ai
            </h2>
          </div>
          <div className="space-y-2 text-xs leading-relaxed" style={{ color: 'var(--ds-text-muted)' }}>
            <p>
              Output.ai is a TypeScript framework for building reliable AI workflows — with Temporal-backed orchestration,
              multi-provider LLM support, tracing, evaluations, and cost tracking. Conductor visualizes every layer:
            </p>
            <ul className="space-y-1 pl-4 list-disc">
              <li><strong style={{ color: 'var(--ds-text-secondary)' }}>Workflow executions</strong> → the main list + detail panel</li>
              <li><strong style={{ color: 'var(--ds-text-secondary)' }}>Step orchestration</strong> → the Flow Graph DAG + Timeline view</li>
              <li><strong style={{ color: 'var(--ds-text-secondary)' }}>LLM traces</strong> → Traces view + Prompt Diff comparison</li>
              <li><strong style={{ color: 'var(--ds-text-secondary)' }}>Evaluations</strong> → Eval Trends with regression detection</li>
              <li><strong style={{ color: 'var(--ds-text-secondary)' }}>Cost & tokens</strong> → Analytics panel + Cost Heatmap</li>
              <li><strong style={{ color: 'var(--ds-text-secondary)' }}>Real-time status</strong> → Live Mode with event stream + toasts</li>
            </ul>
            <p>
              This isn't just a dashboard — it's a proposal for how Output.ai's developer experience could extend
              beyond the SDK into a visual control plane for monitoring, debugging, and optimizing AI pipelines.
            </p>
          </div>
        </motion.section>

        {/* Footer */}
        <div className="pt-4 pb-8 text-center">
          <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
            Built by Brian Brady as a design engineering portfolio piece for Output.ai
          </p>
        </div>
      </div>
    </div>
  );
}
