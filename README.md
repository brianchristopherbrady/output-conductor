# Conductor — Output.ai Workflow Observatory

A visual workflow execution monitor and debugger for [Output.ai](https://output.ai) pipelines. Built as a design engineering showcase demonstrating complex data flows rendered through elegant, performant UI.

![Conductor](https://img.shields.io/badge/Built%20With-Output.ai-6366f1)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Vitest](https://img.shields.io/badge/Vitest-34%20tests-10b981)

## What is this?

Conductor is a real-time observability dashboard for Output.ai workflow executions. It gives developers instant insight into their AI pipelines — traces, costs, evaluator results, and execution timelines — all rendered in a fast, virtualized interface that handles thousands of workflow runs without breaking a sweat.

## Features

- **Virtualized Execution List** — Browse 500+ workflow executions with smooth scrolling via `@tanstack/react-virtual`
- **Step-by-step Execution Detail** — Inspect each step's traces, evaluations, retry counts, and cached results
- **Timeline Swimlanes** — Gantt-style visualization of workflow executions across time, grouped by workflow type
- **Trace Table** — Virtualized table of all 2,000+ traces (LLM calls, HTTP requests, tool invocations, evaluations)
- **Analytics Dashboard** — Cost trends, workflow distribution, provider breakdown, daily execution charts via Recharts
- **Real-time Filtering** — Search, status filter, workflow filter with instant response
- **Animated Transitions** — Framer Motion for smooth panel transitions, list animations, and micro-interactions

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Charts | Recharts |
| Virtualization | @tanstack/react-virtual |
| Testing | Vitest + Testing Library |
| Icons | Lucide React |

## Getting Started

```bash
git clone https://github.com/brianchristopherbrady/output-conductor.git
cd output-conductor
npm install --registry https://registry.npmjs.org/
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Testing

```bash
npm run test:run    # Run all 34 tests
npm run test        # Watch mode
```

## Architecture

```
src/
├── components/
│   ├── dashboard/     # ExecutionList (virtualized), ExecutionDetail
│   ├── timeline/      # TimelineView (swimlane visualization)
│   ├── traces/        # TracesView (virtualized trace table)
│   ├── analytics/     # AnalyticsPanel (charts + metrics)
│   └── shared/        # StatusBadge, MetricCard
├── hooks/             # useWorkflowData (state management)
├── data/              # Mock data generators matching Output.ai schema
├── types/             # TypeScript interfaces
├── utils/             # Formatters + helpers
└── __tests__/         # Vitest test suites
```

## Design Decisions

1. **UI Virtualization**: The execution list and trace table render only visible rows, enabling smooth performance with thousands of items
2. **Split-pane Layout**: Master-detail pattern for execution browsing — list on left, detail on right with animated width transitions
3. **Progressive Disclosure**: Step cards show summary by default, traces and evaluations expand inline
4. **Status-driven Color System**: Consistent emerald/indigo/red/amber mapping across all components
5. **Dark Theme**: Purpose-built for developer tools with zinc-950 backgrounds and high-contrast data

## License

MIT
