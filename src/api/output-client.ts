/**
 * Output.ai API Client
 *
 * This adapter provides a typed interface to Output.ai's REST API.
 * In production, it makes real HTTP calls to the Output API server.
 * In demo mode, it returns mock data shaped to match the actual API responses.
 *
 * API docs: https://docs.output.ai/api/index
 * Base URL configured via OUTPUT_API_URL environment variable.
 *
 * Authentication: Bearer token via OUTPUT_API_KEY
 * @see https://docs.output.ai/api/authentication
 */

import type {
  WorkflowRunStatus,
  WorkflowRunListItem,
  TraceLogResponse,
  WorkflowCatalogEntry,
  CostLlmEvent,
} from './output-types';
import { generateMockRuns, generateMockTrace, generateMockCatalog, generateMockCostEvents } from './mock-adapter';

export interface OutputClientConfig {
  baseUrl: string;
  apiKey: string;
  mode: 'live' | 'demo';
}

const DEFAULT_CONFIG: OutputClientConfig = {
  baseUrl: import.meta.env.VITE_OUTPUT_API_URL || 'http://localhost:8000',
  apiKey: import.meta.env.VITE_OUTPUT_API_KEY || '',
  mode: 'demo', // Always demo for the prototype
};

/**
 * Creates an Output.ai API client.
 *
 * Usage:
 * ```ts
 * const client = createOutputClient({ mode: 'live', baseUrl: '...', apiKey: '...' });
 * const runs = await client.listRuns('patient_intake');
 * const trace = await client.getTraceLog('patient_intake', runs[0].runId);
 * ```
 */
export function createOutputClient(config: Partial<OutputClientConfig> = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  async function fetchApi<T>(path: string): Promise<T> {
    const response = await fetch(`${cfg.baseUrl}${path}`, {
      headers: {
        'Authorization': `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Output API error: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  return {
    /**
     * List workflow runs with optional status filter.
     * GET /workflow/{id}/runs
     */
    async listRuns(workflowId: string, options?: { status?: string; limit?: number }): Promise<WorkflowRunListItem[]> {
      if (cfg.mode === 'demo') {
        return generateMockRuns(workflowId, options?.limit ?? 50);
      }
      const params = new URLSearchParams();
      if (options?.status) params.set('status', options.status);
      if (options?.limit) params.set('limit', String(options.limit));
      return fetchApi(`/workflow/${workflowId}/runs?${params}`);
    },

    /**
     * Get execution status for a specific run.
     * GET /workflow/{id}/runs/{rid}/status
     */
    async getRunStatus(workflowId: string, runId: string): Promise<WorkflowRunStatus> {
      if (cfg.mode === 'demo') {
        const runs = await generateMockRuns(workflowId, 1);
        return {
          workflowId,
          runId,
          workflowName: runs[0]?.workflowName ?? workflowId,
          status: runs[0]?.status ?? 'COMPLETED',
          startTime: runs[0]?.startTime ?? new Date().toISOString(),
          closeTime: runs[0]?.closeTime,
          input: { patientId: 'P-1042' },
        };
      }
      return fetchApi(`/workflow/${workflowId}/runs/${runId}/status`);
    },

    /**
     * Get the full trace tree for a workflow run.
     * GET /workflow/{id}/runs/{rid}/trace-log
     *
     * This is the primary data source for Conductor's:
     * - Traces view (LLM inputs/outputs)
     * - States/Flow view (step execution graph)
     * - Timeline view (step timing)
     * - Diff viewer (prompt comparison between runs)
     */
    async getTraceLog(workflowId: string, runId: string): Promise<TraceLogResponse> {
      if (cfg.mode === 'demo') {
        return generateMockTrace(workflowId, runId);
      }
      return fetchApi(`/workflow/${workflowId}/runs/${runId}/trace-log`);
    },

    /**
     * Get the workflow catalog (all registered workflows).
     * GET /catalog
     */
    async getCatalog(): Promise<WorkflowCatalogEntry[]> {
      if (cfg.mode === 'demo') {
        return generateMockCatalog();
      }
      return fetchApi('/catalog');
    },

    /**
     * Get cost events for a time range.
     * In production, this would query a cost analytics endpoint or
     * aggregate from the cost:llm:request hook events stored in your backend.
     */
    async getCostEvents(options?: { since?: string; until?: string }): Promise<CostLlmEvent[]> {
      if (cfg.mode === 'demo') {
        return generateMockCostEvents();
      }
      const params = new URLSearchParams();
      if (options?.since) params.set('since', options.since);
      if (options?.until) params.set('until', options.until);
      return fetchApi(`/costs/events?${params}`);
    },
  };
}

/** Singleton client instance for the app */
export const outputClient = createOutputClient();
