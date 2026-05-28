export interface WorkflowExecution {
  id: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'retrying';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  steps: StepExecution[];
  totalTokens: number;
  totalCost: number;
  model: string;
  provider: 'anthropic' | 'openai' | 'azure' | 'vertex';
}

export interface StepExecution {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cached';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  traces: Trace[];
  evaluations?: Evaluation[];
  retryCount: number;
  cached: boolean;
}

export interface Trace {
  id: string;
  type: 'llm' | 'http' | 'tool' | 'eval';
  name: string;
  startedAt: Date;
  duration: number;
  status: 'success' | 'error';
  metadata: TraceMetadata;
}

export interface TraceMetadata {
  model?: string;
  provider?: string;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  statusCode?: number;
  url?: string;
  prompt?: string;
  response?: string;
  error?: string;
  latency?: number;
}

export interface Evaluation {
  id: string;
  evaluatorName: string;
  passed: boolean;
  confidence: number;
  reasoning: string;
  score?: number;
}

export interface CostBreakdown {
  date: string;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  totalTokens: number;
  executions: number;
}

export interface WorkflowStats {
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  totalCost: number;
  totalTokens: number;
  avgTokensPerExecution: number;
}

export type ViewMode = 'dashboard' | 'timeline' | 'traces' | 'analytics' | 'flow' | 'diff' | 'evals';
