import { motion } from 'framer-motion';
import {
  Workflow, Route, GitBranch, Activity, BarChart3, GitCompare, TrendingUp,
  Radio, Command, Keyboard, Palette, Layers, Gauge, Eye, Sparkles, Code2,
  Monitor, Zap, ExternalLink, Target, Users, Lightbulb, Box,
} from 'lucide-react';

export function ShowcasePage() {
  return (
    <div className="overflow-auto h-full">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-14">
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
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
                A product built on Output.ai
              </p>
            </div>
          </div>
          <p className="text-base leading-relaxed max-w-3xl" style={{ color: 'var(--ds-text-secondary)' }}>
            Conductor is a visual workflow observatory — a real-time monitoring, debugging, and optimization interface
            for teams running AI pipelines on <strong style={{ color: 'var(--ds-text-primary)' }}>Output.ai</strong>.
            It turns raw execution data into intuitive, actionable views so engineering teams can understand what their
            workflows are doing, why they fail, and how to make them better.
          </p>
        </motion.header>

        {/* The Idea */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" style={{ color: 'var(--color-conductor-500)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ds-text-primary)' }}>The Idea</h2>
          </div>
          <div className="rounded-xl border p-5 space-y-4" style={{ backgroundColor: 'var(--ds-bg-secondary)', borderColor: 'var(--ds-border-primary)' }}>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
              Output.ai gives you everything to <em>build</em> AI workflows — type-safe orchestration, prompt management,
              evaluators, tracing, cost tracking. But once workflows are running in production, teams need a way to <em>see</em> what's happening.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
              <strong style={{ color: 'var(--ds-text-primary)' }}>Conductor is the visual layer that sits on top of Output.ai's runtime.</strong> It
              connects to the execution history API, trace log endpoints, and cost events to render a complete picture of
              every workflow run — from the high-level execution list down to individual LLM prompts and token costs.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ds-text-secondary)' }}>
              Think of it as the "Vercel Dashboard" for Output.ai pipelines — the observability companion that makes
              the framework complete.
            </p>
          </div>
        </motion.section>

        {/* Who It's For */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" style={{ color: 'var(--color-conductor-500)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ds-text-primary)' }}>Who It's For</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { role: 'AI Engineers', desc: 'Debug failing steps, compare prompt versions across runs, trace why an evaluator scored low.' },
              { role: 'Platform Teams', desc: 'Monitor cost trends, track provider usage, identify runaway workflows before budgets blow up.' },
              { role: 'Product Managers', desc: 'Understand pipeline health, quality trends over time, and where latency bottlenecks live.' },
            ].map(item => (
              <div key={item.role} className="rounded-xl border p-4 space-y-2"
                style={{ backgroundColor: 'var(--ds-bg-secondary)', borderColor: 'var(--ds-border-primary)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>{item.role}</span>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ds-text-muted)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* How It Connects to Output.ai */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Box className="h-5 w-5" style={{ color: 'var(--color-conductor-500)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ds-text-primary)' }}>How It Connects to Output.ai</h2>
          </div>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--ds-border-primary)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--ds-bg-tertiary)' }}>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ds-text-muted)' }}>Output.ai Feature</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ds-text-muted)' }}>API Endpoint</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--ds-text-muted)' }}>Conductor View</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: 'var(--ds-bg-secondary)' }}>
                {[
                  ['Workflow Orchestration', '/workflow/{id}/runs', 'Execution list + detail panel'],
                  ['Step Execution', '/workflow/{id}/runs/{rid}/status', 'States (flow graph) + Timeline'],
                  ['Trace Logs', '/workflow/{id}/runs/{rid}/trace-log', 'Traces view + Prompt Diff'],
                  ['Evaluators', 'Eval verdicts in trace data', 'Insights: regression table + trends'],
                  ['Cost Events', 'cost:llm:request hooks', 'Analytics: heatmap + cost chart'],
                  ['Temporal History', '/workflow/{id}/runs/{rid}/history', 'Timeline swimlanes'],
                ].map(([feature, endpoint, view], i) => (
                  <tr key={i} className="border-t" style={{ borderColor: 'var(--ds-border-secondary)' }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--ds-text-primary)' }}>{feature}</td>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: 'var(--ds-text-muted)' }}>{endpoint}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--ds-text-secondary)' }}>{view}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--ds-text-muted)' }}>
            Conductor consumes Output.ai's REST API and trace data. In production, it would subscribe to real-time
            events via the Temporal event stream for live workflow monitoring. This prototype uses mock data shaped
            to match Output.ai's actual data model — workflows with typed inputs/outputs, steps, LLM traces, evaluator verdicts, and cost events.
          </p>
        </motion.section>

        {/* Experience Design */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" style={{ color: 'var(--color-conductor-500)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ds-text-primary)' }}>Designing the Experience</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                title: 'Progressive Disclosure',
                description: 'Start with the execution list — a scannable overview of every workflow run. Click to drill into a run\'s steps, timing, traces, and evals. Each layer reveals more detail without overwhelming the first view.',
              },
              {
                title: 'Template → State Pattern',
                description: 'The flow graph shows the workflow\'s DAG structure as a neutral template. Select a specific run, and the nodes fill with execution state (pass/fail, duration, cost). This teaches the pipeline topology before adding complexity.',
              },
              {
                title: 'Comparison as a First-Class Concept',
                description: 'Output.ai\'s prompt files live in version control. Conductor\'s diff viewer lets you compare prompts and outputs between any two runs — making it trivial to see how prompt changes affect quality.',
              },
              {
                title: 'Quality Signals, Not Just Logs',
                description: 'Rather than raw trace dumps, Conductor surfaces evaluator regression alerts, pass rate trends, and confidence distributions. Teams see quality direction at a glance without reading individual traces.',
              },
              {
                title: 'Cost Awareness',
                description: 'The cost heatmap and analytics panel make spend visible. Teams using Output.ai in production need to know: which workflows are expensive? Which days spike? Which providers eat budget?',
              },
            ].map((decision) => (
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

        {/* Features Built */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: 'var(--color-conductor-500)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ds-text-primary)' }}>What's in the Prototype</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: <Workflow className="h-4 w-4" />, title: 'Virtualized Execution List', desc: 'Browse 500+ runs with constant-performance scroll (TanStack Virtual).' },
              { icon: <Route className="h-4 w-4" />, title: 'Pipeline Flow Graph', desc: 'SVG DAG with animated particles, click-to-inspect nodes, execution state overlay.' },
              { icon: <GitBranch className="h-4 w-4" />, title: 'Timeline Swimlanes', desc: 'Temporal view showing parallel step execution and latency bottlenecks.' },
              { icon: <GitCompare className="h-4 w-4" />, title: 'Prompt Diff Viewer', desc: 'LCS-based side-by-side comparison of prompts and responses between runs.' },
              { icon: <TrendingUp className="h-4 w-4" />, title: 'Evaluation Insights', desc: 'Regression detection, pass rate trends, confidence histograms, multi-select filtering.' },
              { icon: <BarChart3 className="h-4 w-4" />, title: 'Cost Heatmap + Analytics', desc: 'GitHub-style calendar, daily spend, provider breakdown, token tracking.' },
              { icon: <Radio className="h-4 w-4" />, title: 'Live Mode', desc: 'Simulated real-time event stream with toast notifications.' },
              { icon: <Command className="h-4 w-4" />, title: 'Command Palette + Shortcuts', desc: 'Ctrl+K search, 1-7 view switching, j/k navigation, ? for help.' },
              { icon: <Palette className="h-4 w-4" />, title: 'Design System', desc: '60+ semantic tokens, light/dark themes, 3 density modes, zero-rerender switching.' },
              { icon: <Activity className="h-4 w-4" />, title: 'Demo Scenario', desc: '"Meridian Health" — a healthcare company using Output.ai for clinical AI workflows.' },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 rounded-xl border p-3"
                style={{ backgroundColor: 'var(--ds-bg-secondary)', borderColor: 'var(--ds-border-primary)' }}>
                <div className="rounded-lg p-1.5 shrink-0" style={{ backgroundColor: 'var(--ds-bg-tertiary)', color: 'var(--ds-text-secondary)' }}>
                  {feature.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold" style={{ color: 'var(--ds-text-primary)' }}>{feature.title}</h3>
                  <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: 'var(--ds-text-muted)' }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Tech Stack */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5" style={{ color: 'var(--color-conductor-500)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ds-text-primary)' }}>Built With</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              'React 19', 'TypeScript', 'Vite', 'Tailwind CSS 4', 'Framer Motion',
              'TanStack Virtual', 'Recharts', 'Vitest', 'date-fns', 'Lucide Icons',
            ].map(tech => (
              <span key={tech} className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                style={{ backgroundColor: 'var(--ds-bg-secondary)', borderColor: 'var(--ds-border-primary)', color: 'var(--ds-text-primary)' }}>
                {tech}
              </span>
            ))}
          </div>
        </motion.section>

        {/* Why This Product */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl border p-5 space-y-3"
          style={{ backgroundColor: 'var(--ds-bg-secondary)', borderColor: 'var(--ds-border-primary)' }}
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" style={{ color: 'var(--ds-text-muted)' }} />
            <h2 className="text-sm font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
              Why This Product Fits Output.ai
            </h2>
          </div>
          <div className="space-y-3 text-xs leading-relaxed" style={{ color: 'var(--ds-text-muted)' }}>
            <p>
              Output.ai already collects the data: execution history, trace logs, evaluator verdicts, cost events.
              The framework's APIs expose all of this. What's missing is a <strong style={{ color: 'var(--ds-text-secondary)' }}>visual interface</strong> that
              makes it intuitive to navigate.
            </p>
            <p>
              Conductor fills that gap. It's not a competitor to Output.ai — it's a <strong style={{ color: 'var(--ds-text-secondary)' }}>product that only exists because Output.ai exists</strong>.
              Every view maps directly to a framework feature. The execution list consumes the runs API. The flow graph renders
              the workflow/step structure. The diff viewer compares trace log outputs. The insights page aggregates evaluator verdicts.
              The cost panel uses cost event hooks.
            </p>
            <p>
              This is the kind of product I'd want to build at Output.ai — making powerful infrastructure <em>visible</em> and <em>navigable</em> for
              the engineers who use it every day.
            </p>
          </div>
        </motion.section>

        {/* Footer */}
        <div className="pt-4 pb-8 text-center space-y-2">
          <p className="text-sm font-medium" style={{ color: 'var(--ds-text-primary)' }}>
            Brian Brady
          </p>
          <p className="text-xs" style={{ color: 'var(--ds-text-muted)' }}>
            Design Engineer — built as a portfolio piece for Output.ai
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href="https://github.com/brianchristopherbrady/output-conductor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--ds-text-link)' }}
            >
              <ExternalLink className="h-3 w-3" />
              Source Code
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
