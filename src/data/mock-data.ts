import { WorkflowExecution, StepExecution, Trace, CostBreakdown } from '@/types';
import { subHours, subMinutes, subDays, format } from 'date-fns';

const WORKFLOW_NAMES = [
  'research_company',
  'blog_evaluator',
  'changelog_generator',
  'dependency_audit',
  'sales_call_processor',
  'ai_hn_digest',
  'url_summarizer',
  'youtube_summarizer',
  'recipe_extractor',
  'call_scorer',
];

const STEP_NAMES: Record<string, string[]> = {
  research_company: ['scrapeWebsite', 'extractContent', 'analyzeCompetitors', 'generateBrief'],
  blog_evaluator: ['fetchArticle', 'extractSignals', 'scoreQuality', 'generateReport'],
  changelog_generator: ['fetchCommits', 'categorizeChanges', 'generateMarkdown', 'publishChangelog'],
  dependency_audit: ['scanDependencies', 'checkVulnerabilities', 'analyzeLicenses', 'scoreHealth'],
  sales_call_processor: ['transcribeCall', 'extractInsights', 'scoreMethodology', 'generateNotes'],
  ai_hn_digest: ['fetchTopStories', 'scoreRelevance', 'summarizeArticles', 'composeNewsletter', 'publishToBeehiiv'],
  url_summarizer: ['fetchPage', 'extractContent', 'generateSummary'],
  youtube_summarizer: ['fetchTranscript', 'identifyMoments', 'generateSummary'],
  recipe_extractor: ['fetchPage', 'extractRecipe', 'normalizeUnits', 'validateSchema'],
  call_scorer: ['parseTranscript', 'identifyFramework', 'scoreCategories', 'generateFeedback'],
};

const MODELS = ['claude-sonnet-4-20250514', 'claude-haiku-3-20250414', 'gpt-4o', 'gpt-4o-mini'];
const PROVIDERS: ('anthropic' | 'openai' | 'azure' | 'vertex')[] = ['anthropic', 'openai', 'azure', 'vertex'];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomId(): string {
  return `wf_${Math.random().toString(36).substring(2, 10)}`;
}

const PROMPT_VARIATIONS = [
  (step: string) => `You are a ${step} specialist. Analyze the following content and provide structured output.\n\nContext: Process the input data according to standard ${step} guidelines.\nFormat: JSON\nMax tokens: 2048`,
  (step: string) => `You are an expert ${step} agent. Your task is to carefully analyze the provided input and return a well-structured result.\n\nInstructions:\n1. Parse the input thoroughly\n2. Apply ${step} logic\n3. Return valid JSON with confidence scores\n\nBe concise and precise.`,
  (step: string) => `System: You are a specialized ${step} processor.\nRole: Senior analyst\nObjective: Extract structured insights from the given content.\n\nRules:\n- Output must be valid JSON\n- Include metadata fields\n- Flag any anomalies detected during ${step}`,
  (step: string) => `[${step.toUpperCase()}] Process the following input.\n\nYou must:\n- Analyze content for relevance\n- Score quality on a 0-100 scale\n- Provide reasoning for your assessment\n- Return structured JSON output\n\nTemperature: 0.3\nModel behavior: deterministic`,
  (step: string) => `As a ${step} specialist, evaluate the following:\n\nPriority: accuracy over speed\nOutput schema: { "result": string, "confidence": number, "flags": string[] }\n\nProcess step: ${step}\nVersion: 2.1.0`,
];

const RESPONSE_VARIATIONS = [
  (step: string, confidence: number) => `{"result": "Analysis complete for ${step}", "confidence": ${confidence}, "flags": [], "processingTime": "${randomBetween(100, 900)}ms"}`,
  (step: string, confidence: number) => `{\n  "result": "${step} evaluation passed",\n  "confidence": ${confidence},\n  "details": {\n    "itemsProcessed": ${randomBetween(3, 15)},\n    "warnings": ${randomBetween(0, 2)}\n  }\n}`,
  (step: string, confidence: number) => `{"status": "success", "step": "${step}", "output": {"score": ${confidence}, "categories": [${randomBetween(2, 5)} items], "summary": "Processed successfully"}}`,
  (step: string, confidence: number) => `{\n  "result": "Completed ${step}",\n  "confidence": ${confidence / 100},\n  "metadata": {\n    "model": "v2",\n    "tokens_used": ${randomBetween(200, 1500)},\n    "latency_ms": ${randomBetween(80, 600)}\n  },\n  "output": "Structured analysis complete"\n}`,
  (step: string, confidence: number) => `{"step": "${step}", "status": "done", "confidence": ${confidence}, "findings": ["Primary analysis complete", "No anomalies detected", "${randomBetween(1, 8)} sub-items processed"]}`,
];

function generateTrace(stepName: string, index: number, forceType?: Trace['type']): Trace {
  const types: Trace['type'][] = ['llm', 'http', 'tool', 'eval'];
  const type = forceType ?? (index === 0 ? 'http' : index === 1 ? 'llm' : types[randomBetween(0, 3)]);
  const isError = Math.random() < 0.05;

  const base = {
    id: `tr_${Math.random().toString(36).substring(2, 10)}`,
    name: type === 'llm' ? `generateText(${stepName})` : type === 'http' ? `fetch(${stepName})` : `${type}(${stepName})`,
    startedAt: new Date(),
    duration: randomBetween(50, 3000),
    status: isError ? 'error' as const : 'success' as const,
    type,
    metadata: {},
  };

  if (type === 'llm') {
    const inputTokens = randomBetween(200, 4000);
    const outputTokens = randomBetween(100, 2000);
    base.metadata = {
      model: MODELS[randomBetween(0, MODELS.length - 1)],
      provider: PROVIDERS[randomBetween(0, PROVIDERS.length - 1)],
      inputTokens,
      outputTokens,
      cost: (inputTokens * 0.000003 + outputTokens * 0.000015),
      prompt: PROMPT_VARIATIONS[randomBetween(0, PROMPT_VARIATIONS.length - 1)](stepName),
      response: isError ? undefined : RESPONSE_VARIATIONS[randomBetween(0, RESPONSE_VARIATIONS.length - 1)](stepName, randomBetween(70, 99)),
      error: isError ? 'Rate limit exceeded. Retrying in 2s...' : undefined,
    };
  } else if (type === 'http') {
    base.metadata = {
      url: `https://api.example.com/${stepName.toLowerCase()}`,
      statusCode: isError ? 500 : 200,
      latency: randomBetween(50, 800),
    };
  }

  return base;
}

function generateStep(name: string, workflowStart: Date, stepIndex: number, totalSteps: number): StepExecution {
  const isCompleted = Math.random() > 0.1;
  const isCached = Math.random() < 0.15;
  const hasFailed = !isCompleted && Math.random() > 0.5;
  const stepDelay = (stepIndex / totalSteps) * randomBetween(2000, 8000);
  const startedAt = new Date(workflowStart.getTime() + stepDelay);
  const duration = isCached ? randomBetween(5, 50) : randomBetween(500, 5000);

  const status: StepExecution['status'] = isCached
    ? 'cached'
    : hasFailed
    ? 'failed'
    : isCompleted
    ? 'completed'
    : 'running';

  const traceCount = isCached ? 1 : randomBetween(2, 4);
  const traces = Array.from({ length: traceCount }, (_, i) =>
    generateTrace(name, i, isCached ? 'llm' : undefined)
  );

  return {
    id: `step_${Math.random().toString(36).substring(2, 10)}`,
    name,
    status,
    startedAt,
    completedAt: status === 'completed' || status === 'cached' ? new Date(startedAt.getTime() + duration) : undefined,
    duration: status === 'running' ? undefined : duration,
    traces,
    evaluations: Math.random() > 0.6 ? [{
      id: `eval_${Math.random().toString(36).substring(2, 10)}`,
      evaluatorName: `check_${name}_quality`,
      passed: Math.random() > 0.2,
      confidence: randomBetween(60, 99),
      reasoning: `Output meets quality threshold with ${randomBetween(3, 8)} positive signals detected.`,
      score: randomBetween(60, 100) / 100,
    }] : undefined,
    retryCount: hasFailed ? randomBetween(1, 3) : 0,
    cached: isCached,
  };
}

export function generateExecutions(count: number = 200): WorkflowExecution[] {
  const executions: WorkflowExecution[] = [];

  for (let i = 0; i < count; i++) {
    const workflowName = WORKFLOW_NAMES[randomBetween(0, WORKFLOW_NAMES.length - 1)];
    const stepNames = STEP_NAMES[workflowName] || ['step1', 'step2', 'step3'];
    const startedAt = subMinutes(new Date(), randomBetween(0, 60 * 24 * 7));
    const steps = stepNames.map((name, idx) => generateStep(name, startedAt, idx, stepNames.length));

    const allCompleted = steps.every(s => s.status === 'completed' || s.status === 'cached');
    const hasFailed = steps.some(s => s.status === 'failed');
    const isRunning = steps.some(s => s.status === 'running');
    const status: WorkflowExecution['status'] = isRunning
      ? 'running'
      : hasFailed
      ? 'failed'
      : allCompleted
      ? 'completed'
      : 'retrying';

    const totalDuration = steps.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalTokens = steps.flatMap(s => s.traces)
      .reduce((sum, t) => sum + (t.metadata.inputTokens || 0) + (t.metadata.outputTokens || 0), 0);
    const totalCost = steps.flatMap(s => s.traces)
      .reduce((sum, t) => sum + (t.metadata.cost || 0), 0);

    executions.push({
      id: randomId(),
      workflowName,
      status,
      startedAt,
      completedAt: status === 'completed' || status === 'failed' ? new Date(startedAt.getTime() + totalDuration) : undefined,
      duration: totalDuration,
      input: { topic: `Sample input for ${workflowName}` },
      output: status === 'completed' ? { result: 'Success' } : undefined,
      steps,
      totalTokens,
      totalCost,
      model: MODELS[randomBetween(0, MODELS.length - 1)],
      provider: PROVIDERS[randomBetween(0, PROVIDERS.length - 1)],
    });
  }

  return executions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

export function generateCostBreakdown(days: number = 30): CostBreakdown[] {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - 1 - i);
    const executions = randomBetween(5, 50);
    const inputCost = executions * randomBetween(1, 15) * 0.01;
    const outputCost = executions * randomBetween(2, 25) * 0.01;

    return {
      date: format(date, 'MMM dd'),
      inputCost: Math.round(inputCost * 100) / 100,
      outputCost: Math.round(outputCost * 100) / 100,
      totalCost: Math.round((inputCost + outputCost) * 100) / 100,
      totalTokens: executions * randomBetween(2000, 8000),
      executions,
    };
  });
}
