/**
 * Output.ai Integration Layer
 *
 * This module provides the connection between Conductor and Output.ai.
 * It exports:
 * - Types matching Output.ai's actual trace format and API responses
 * - A client that can operate in 'live' (real API) or 'demo' (mock data) mode
 *
 * In production, configure with:
 *   VITE_OUTPUT_API_URL=https://your-output-api.com
 *   VITE_OUTPUT_API_KEY=your-api-key
 *
 * The client automatically falls back to demo mode when no API URL is configured.
 */

export type {
  TraceNode,
  TraceNodeKind,
  TraceError,
  LlmTraceInput,
  LlmTraceOutput,
  TokenUsage,
  EvaluatorOutput,
  CostLlmEvent,
  CostHttpEvent,
  WorkflowRunStatus,
  WorkflowRunListItem,
  TraceLogResponse,
  WorkflowCatalogEntry,
  WorkflowStartEvent,
  WorkflowEndEvent,
  WorkflowErrorEvent,
} from './output-types';

export { createOutputClient, outputClient } from './output-client';
export type { OutputClientConfig } from './output-client';
