/**
 * Output.ai Trace & API Types
 *
 * These types match the Output.ai framework's actual data structures
 * as documented at https://docs.output.ai/operations/tracing
 * and the REST API at https://docs.output.ai/api/index
 *
 * In production, Conductor would consume these directly from Output.ai's API.
 * In demo mode, we generate mock data conforming to these shapes.
 */

// ─── Trace Node Types ────────────────────────────────────────────────────────

export type TraceNodeKind = 'workflow' | 'step' | 'evaluator' | 'llm' | 'http';

/**
 * Core trace node — the recursive unit of Output.ai's trace tree.
 * Every workflow run produces a root node of kind "workflow" with children
 * representing steps, evaluators, LLM calls, and HTTP calls.
 *
 * @see https://docs.output.ai/operations/tracing#reading-a-trace
 */
export interface TraceNode {
  id: string;
  kind: TraceNodeKind;
  name: string;
  startedAt: number;  // Unix timestamp (ms)
  endedAt: number;    // Unix timestamp (ms)
  input: unknown;
  output?: unknown;
  error?: TraceError;
  children: TraceNode[];
}

export interface TraceError {
  name: string;
  message: string;
  stack?: string;
}

// ─── LLM-Specific Trace Fields ──────────────────────────────────────────────

export interface LlmTraceInput {
  prompt: string;        // e.g. "generate_summary@v1"
  variables: Record<string, unknown>;
  loadedPrompt?: {
    name: string;
    config: {
      provider: string;  // e.g. "anthropic", "openai"
      model: string;     // e.g. "claude-sonnet-4-20250514", "gpt-4o"
    };
  };
}

export interface LlmTraceOutput {
  result: string;
  usage: TokenUsage;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// ─── Evaluator-Specific Trace Fields ─────────────────────────────────────────

export interface EvaluatorOutput {
  value: boolean | number | string;
  confidence: number;   // 0–1
  reasoning: string;
}

// ─── Cost Events ─────────────────────────────────────────────────────────────

/**
 * Cost event payload from the `cost:llm:request` hook.
 * @see https://docs.output.ai/costs/cost-events
 */
export interface CostLlmEvent {
  eventId: string;
  workflowId: string;
  runId: string;
  activityId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number; // USD
  timestamp: number;
}

/**
 * Cost event payload from the `cost:http:request` hook.
 */
export interface CostHttpEvent {
  eventId: string;
  workflowId: string;
  runId: string;
  activityId: string;
  method: string;
  url: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
}

// ─── Workflow Run API Types ──────────────────────────────────────────────────

/**
 * Response shape from GET /workflow/{id}/runs/{rid}/status
 * @see https://docs.output.ai/api-reference/get-workflow-execution-status-for-a-specific-run
 */
export interface WorkflowRunStatus {
  workflowId: string;
  runId: string;
  workflowName: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TERMINATED' | 'TIMED_OUT';
  startTime: string;   // ISO 8601
  closeTime?: string;  // ISO 8601, present when completed
  input: unknown;
  output?: unknown;
  error?: TraceError;
}

/**
 * Response shape from GET /workflow/{id}/runs
 * @see https://docs.output.ai/api-reference/list-workflow-runs
 */
export interface WorkflowRunListItem {
  workflowId: string;
  runId: string;
  workflowName: string;
  status: WorkflowRunStatus['status'];
  startTime: string;
  closeTime?: string;
}

/**
 * Response shape from GET /workflow/{id}/runs/{rid}/trace-log
 * @see https://docs.output.ai/api-reference/get-workflow-trace-log-data-for-a-specific-run
 */
export interface TraceLogResponse {
  workflowId: string;
  runId: string;
  trace: TraceNode;  // Root trace tree
}

/**
 * Workflow catalog entry from GET /catalog
 * @see https://docs.output.ai/api-reference/get-the-default-workflow-catalog
 */
export interface WorkflowCatalogEntry {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;  // JSON Schema
  outputSchema?: Record<string, unknown>;
}

// ─── Hook Event Types ────────────────────────────────────────────────────────

/**
 * Lifecycle hook events that Conductor would subscribe to for real-time monitoring.
 * @see https://docs.output.ai/packages/core#hooks
 */
export interface WorkflowStartEvent {
  eventId: string;
  id: string;       // workflow ID
  runId: string;    // Temporal run ID
  name: string;     // workflow type name
}

export interface WorkflowEndEvent {
  eventId: string;
  id: string;
  runId: string;
  name: string;
  duration: number; // ms
}

export interface WorkflowErrorEvent {
  eventId: string;
  id: string;
  runId: string;
  name: string;
  duration: number;
  error: TraceError;
}
