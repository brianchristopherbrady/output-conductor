# Building Conductor: A Design Engineer's Case for Output.ai

## Part A: My Story

I build things that make complexity disappear.

The thread running through my career is a refusal to accept that powerful tools must be hard to use. I've shipped production interfaces for data platforms, AI systems, and developer tools — and in every case, the challenge wasn't making something work, it was making something that *feels* effortless while doing genuinely hard things under the hood.

### How I Think About Design Engineering

Design engineering, to me, lives at the exact intersection where system architecture meets human attention. It's not just "frontend that looks good" — it's the discipline of encoding complex domain logic into spatial, temporal, and visual patterns that a person can parse in milliseconds.

Here's what that means in practice:

**Performance is a design decision.** When you're rendering 2,000 trace entries, the choice to virtualize isn't a technical optimization — it's a UX decision that determines whether your tool feels alive or dead. I reach for `@tanstack/react-virtual` the same way a designer reaches for whitespace: it's a tool for directing attention.

**Animation communicates state.** A panel sliding in at 200ms tells the user "this is a child of what you just clicked." A pulse on a status dot says "this is still happening." These aren't decorations — they're information channels. Framer Motion isn't a luxury; it's how I reduce cognitive load.

**Progressive disclosure is respect.** Not everyone needs to see LLM token counts on first glance. But the engineer debugging a failed workflow at 2am absolutely does. The art is layering information so both users feel served — the scanner who wants a green checkmark, and the investigator who needs the full trace.

**Type safety is design infrastructure.** When every workflow execution, step, trace, and evaluation has a typed interface, the component tree becomes self-documenting. Props tell you what's possible. Discriminated unions tell you what's valid. TypeScript isn't overhead — it's the contract between data and pixels.

### What I've Built

I've designed and built:

- **Visualization systems** that render thousands of data points with sub-16ms frame times, using virtualization and canvas rendering to keep complex dashboards responsive
- **Real-time monitoring interfaces** with WebSocket-driven state, optimistic updates, and animated transitions that make live data feel tangible
- **Design systems** with consistent token hierarchies, compound components, and accessibility baked into every primitive
- **Developer tools** where the interface itself teaches you the underlying system — where the UI is the documentation

The common denominator: taking systems that would be overwhelming as raw data and giving them spatial form. Making the invisible visible, and the complex approachable.

### Why This Role

Output.ai is building the infrastructure layer for AI workflows. Temporal-backed orchestration. Multi-provider LLM abstraction. Durable execution with full tracing. That's an incredible foundation — but infrastructure only realizes its value when developers can *see* what's happening inside it.

The gap between "your workflow ran" and "you understand exactly what happened, what it cost, and why step 3 retried" — that's a design engineering problem. It's my problem. It's the exact kind of problem I get out of bed to solve.

I want to be at Output because you're building the Rails of AI workflows, and Rails needed a console, a profiler, and a way to understand what's happening. You need someone who can design those experiences with the same rigor that went into the execution engine. That's me.

---

## Part B: A Product I'd Build — Conductor

### The Idea

**Conductor** is a real-time workflow observatory for Output.ai. It's the missing observability layer that transforms Output's JSON trace logs into a visual, interactive debugging experience.

Today, Output stores rich execution data — every LLM call, HTTP request, evaluator result, retry, and cost — in `logs/runs/` as JSON files. Claude Code can analyze them. But humans need something faster. They need to glance at a dashboard and know: *Are my workflows healthy? What's failing? What's expensive? Where should I look?*

Conductor answers those questions in milliseconds.

### Who It's For

1. **AI engineers in development** — iterating on workflows, checking if their prompt changes improved evaluator scores, debugging why a step is retrying.
2. **Team leads** — monitoring cost trends across workflows, catching anomalies before they become incidents.
3. **New Output users** — learning how the framework works by watching their workflows execute step by step, with every trace visible and explained.

### The Experience

#### 1. Execution Feed (Virtualized Master List)

The primary view is a real-time feed of workflow executions, sorted by recency. Each card shows:
- Workflow name + status badge (with pulse animation for running workflows)
- Step completion progress as a segmented bar (green = completed, cyan = cached, indigo = running, red = failed)
- Key metrics at a glance: duration, token count, cost
- Relative time ("2 minutes ago")

This list is **virtualized** — rendering only visible items. You can scroll through 500+ executions at 60fps. The implementation uses `@tanstack/react-virtual` with 10-item overscan for smooth scrolling.

#### 2. Execution Detail (Split-Pane Inspector)

Click any execution and the detail panel slides in from the right, animated with Framer Motion. The list compresses to 50% width. Inside:

- **Metrics bar**: Duration, tokens, cost, model — all at a glance
- **Step timeline**: Each step rendered as a card with connection lines between them. Status-colored borders. Inline trace expansion.
- **Trace inspection**: Every LLM call shows model, token counts, cost. HTTP requests show URL and status code. Evaluators show pass/fail with confidence scores and reasoning.
- **Evaluator results**: Green checkmark or red X, confidence percentage, and the LLM judge's reasoning — making quality gates visible and debuggable.

The design uses progressive disclosure. Steps show their name and status by default. Expand to see traces. Expand further to see prompt/response pairs. You never see more than you need.

#### 3. Timeline Swimlanes

A Gantt-chart-inspired view where workflows are grouped into horizontal lanes by type. Each execution appears as a colored bar positioned along a time axis. You can instantly see:
- Which workflows run most frequently
- Cluster patterns (are your newsletter digests all firing at the same time?)
- Duration distribution (long bars = slow executions worth investigating)

Hover for details. Click to jump to the execution detail.

#### 4. Trace Table (Virtualized Data Grid)

A flat, filterable table of every trace across all executions. 2,000+ rows, virtualized. Columns: type (color-coded badge), name, workflow, step, duration, status. Filter by trace type to find all LLM calls, or all failed HTTP requests, or all evaluator invocations.

This view is for the engineer who knows something is wrong and needs to find it fast.

#### 5. Analytics Dashboard

Recharts-powered visualizations:
- **Cost over time** (stacked area chart: input cost vs output cost)
- **Workflow distribution** (horizontal bar chart showing which workflows run most)
- **Provider breakdown** (donut chart showing Anthropic vs OpenAI vs Azure usage)
- **Daily execution volume** (bar chart with trend visibility)
- **Summary metrics** with week-over-week trends

### Design Principles Applied

**Information density without overwhelm.** Every view packs significant data into the viewport, but uses whitespace, typography hierarchy, and color coding to keep it scannable. The zinc-950 dark theme with emerald/indigo/red/amber status colors creates instant pattern recognition.

**Performance as a feature.** Virtualization means the app stays responsive regardless of data volume. No pagination. No "load more." Just scroll. This is a deliberate design choice — pagination breaks flow state.

**Consistency breeds learnability.** The same status colors, same badge component, same metric formatting appear everywhere. Learn it once in the execution list, recognize it instantly in the trace table.

**Animated transitions as wayfinding.** When you click an execution, the detail panel animates in and the list compresses. This spatial metaphor tells you where the detail came from and how to dismiss it. When you switch views, a fade transition signals context change without disorienting.

### Technical Implementation

The prototype is fully functional:
- **React 19** with modern hooks and memo patterns
- **Vite 8** for instant HMR during development
- **Tailwind CSS 4** with custom theme tokens for the design system
- **TypeScript** with strict mode — every interface typed, no `any`
- **Vitest** with 34 passing tests covering utilities, data generation, components, and hooks
- **500 mock executions** generated to match Output.ai's real data schema (workflows, steps, traces, evaluations, cost breakdowns)

### What's Next

In a production version, Conductor would:
- Connect to Output's `logs/runs/` directory via file watcher or API
- Support real-time streaming of running workflow updates via WebSocket
- Add prompt diff visualization for A/B testing prompt versions
- Include evaluator trend charts (is quality improving over time?)
- Ship as an optional `@outputai/conductor` package that hooks into `npx output dev`

---

## The Thread

Output.ai is building the framework that makes AI workflows professional, durable, and observable from day one. Conductor is the visual layer that makes that observability *human* — not just machine-readable traces, but spatial, temporal, interactive understanding.

That's what I do. I take systems with incredible depth and give them surfaces that invite exploration. I make complex things feel simple without losing any of the power underneath.

I want to do that for Output.
