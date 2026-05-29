/**
 * Mock Data Adapter for Output.ai API
 *
 * Generates realistic mock data conforming to Output.ai's actual trace format.
 * This is what powers Conductor in demo mode. In production, the output-client
 * would fetch real data from the Output API instead.
 *
 * The trace tree structure matches:
 * https://docs.output.ai/operations/tracing#reading-a-trace
 */

import { format, subDays, subHours, subMinutes } from 'date-fns';
import type {
  TraceNode,
  TraceLogResponse,
  WorkflowRunListItem,
  WorkflowCatalogEntry,
  CostLlmEvent,
  LlmTraceInput,
  LlmTraceOutput,
  EvaluatorOutput,
} from './output-types';

// ─── Meridian Health Workflow Definitions ─────────────────────────────────────

const WORKFLOWS: Record<string, { description: string; steps: string[]; evaluators: string[] }> = {
  patient_intake: {
    description: 'Process new patient intake forms, extract medical history, and route to appropriate department',
    steps: ['extractPatientInfo', 'validateInsurance', 'classifyUrgency', 'routeDepartment'],
    evaluators: ['judgeExtractionAccuracy', 'judgeRoutingCorrectness'],
  },
  clinical_notes: {
    description: 'Summarize physician dictation into structured clinical notes with ICD-10 codes',
    steps: ['transcribeAudio', 'extractFindings', 'generateICD10', 'formatNote'],
    evaluators: ['judgeNoteCompleteness', 'judgeCodeAccuracy'],
  },
  insurance_verify: {
    description: 'Verify patient insurance coverage and pre-authorize procedures',
    steps: ['lookupPolicy', 'checkCoverage', 'submitPreAuth', 'notifyPatient'],
    evaluators: ['judgeVerificationAccuracy'],
  },
  lab_results: {
    description: 'Interpret lab results, flag abnormalities, and generate patient-friendly summaries',
    steps: ['parseLabReport', 'flagAbnormalities', 'generateSummary', 'assessRisk'],
    evaluators: ['judgeFlagAccuracy', 'judgeSummaryClarity'],
  },
  referral_router: {
    description: 'Route specialist referrals based on clinical need, availability, and insurance network',
    steps: ['analyzeReferral', 'matchSpecialists', 'checkAvailability', 'scheduleAppointment'],
    evaluators: ['judgeMatchQuality'],
  },
  discharge_summary: {
    description: 'Generate discharge instructions with medication reconciliation and follow-up plan',
    steps: ['reviewStay', 'reconcileMedications', 'generateInstructions', 'createFollowUp'],
    evaluators: ['judgeInstructionClarity', 'judgeMedSafety'],
  },
  prior_auth: {
    description: 'Automate prior authorization requests with clinical justification generation',
    steps: ['extractProcedureInfo', 'gatherClinicalEvidence', 'generateJustification', 'submitRequest'],
    evaluators: ['judgeJustificationStrength'],
  },
  appointment_prep: {
    description: 'Prepare pre-visit summaries for physicians with relevant patient history',
    steps: ['pullPatientHistory', 'summarizeRecentVisits', 'identifyConcerns', 'generateBrief'],
    evaluators: ['judgeBriefRelevance'],
  },
  rx_review: {
    description: 'Review prescriptions for interactions, contraindications, and dosing appropriateness',
    steps: ['parsePrescription', 'checkInteractions', 'validateDosing', 'generateAlert'],
    evaluators: ['judgeInteractionDetection', 'judgeDosingSafety'],
  },
  care_plan: {
    description: 'Generate personalized care plans based on diagnosis, guidelines, and patient preferences',
    steps: ['assessCondition', 'matchGuidelines', 'incorporatePreferences', 'generatePlan'],
    evaluators: ['judgePlanAdherence', 'judgePersonalization'],
  },
};

const PROVIDERS = ['anthropic', 'openai'] as const;
const MODELS: Record<string, string[]> = {
  anthropic: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250414'],
  openai: ['gpt-4o', 'gpt-4o-mini'],
};

const PROMPTS: Record<string, string[]> = {
  patient_intake: ['extract_patient_info@v2', 'classify_urgency@v1', 'route_department@v3'],
  clinical_notes: ['transcribe_dictation@v1', 'extract_findings@v2', 'generate_icd10@v1'],
  insurance_verify: ['lookup_policy@v1', 'check_coverage@v2'],
  lab_results: ['parse_lab@v1', 'flag_abnormalities@v2', 'summarize_results@v1'],
  referral_router: ['analyze_referral@v1', 'match_specialists@v2'],
  discharge_summary: ['review_stay@v1', 'generate_instructions@v3'],
  prior_auth: ['extract_procedure@v1', 'generate_justification@v2'],
  appointment_prep: ['summarize_visits@v1', 'generate_brief@v2'],
  rx_review: ['check_interactions@v3', 'validate_dosing@v1'],
  care_plan: ['assess_condition@v1', 'generate_plan@v2'],
};

// ─── Mock Data Generators ────────────────────────────────────────────────────

let seedCounter = 0;
function pseudoRandom(): number {
  seedCounter = (seedCounter * 1664525 + 1013904223) % 4294967296;
  return seedCounter / 4294967296;
}

function resetSeed(seed: number) {
  seedCounter = seed;
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (pseudoRandom() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(pseudoRandom() * arr.length)];
}

/**
 * Generate a trace tree matching Output.ai's documented format.
 * Each workflow has a root node with step children, and steps
 * that call LLMs have llm children with token usage.
 */
function generateTraceTree(workflowName: string, startTime: number, failed: boolean): TraceNode {
  const wf = WORKFLOWS[workflowName] ?? WORKFLOWS.patient_intake;
  const steps = wf.steps;
  const evaluators = wf.evaluators;
  const workflowId = `${workflowName}-${uuid()}`;

  let currentTime = startTime;
  const children: TraceNode[] = [];

  // Generate step nodes
  for (let i = 0; i < steps.length; i++) {
    const stepName = steps[i];
    const stepDuration = 800 + Math.floor(pseudoRandom() * 3000);
    const stepStart = currentTime;
    const stepEnd = stepStart + stepDuration;
    const isFailed = failed && i === steps.length - 1; // last step fails

    const provider = pickRandom(PROVIDERS);
    const model = pickRandom(MODELS[provider]);
    const prompts = PROMPTS[workflowName] ?? PROMPTS.patient_intake;
    const promptName = prompts[i % prompts.length];

    // LLM child for this step
    const llmStart = stepStart + 50;
    const llmEnd = stepEnd - 50;
    const inputTokens = 200 + Math.floor(pseudoRandom() * 1800);
    const outputTokens = 100 + Math.floor(pseudoRandom() * 900);

    const llmInput: LlmTraceInput = {
      prompt: promptName,
      variables: { patientId: `P-${1000 + Math.floor(pseudoRandom() * 9000)}` },
      loadedPrompt: {
        name: promptName,
        config: { provider, model },
      },
    };

    const llmOutput: LlmTraceOutput = {
      result: `Generated ${stepName} output for patient context...`,
      usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
    };

    const llmChild: TraceNode = {
      id: `generateText-${llmStart}`,
      kind: 'llm',
      name: 'generateText',
      startedAt: llmStart,
      endedAt: llmEnd,
      input: llmInput,
      output: isFailed ? undefined : llmOutput,
      error: isFailed ? { name: 'FatalError', message: `LLM call failed: rate limit exceeded for ${model}` } : undefined,
      children: [],
    };

    const stepNode: TraceNode = {
      id: String(i + 1),
      kind: 'step',
      name: `${workflowName}#${stepName}`,
      startedAt: stepStart,
      endedAt: stepEnd,
      input: { patientId: `P-${1000 + Math.floor(pseudoRandom() * 9000)}`, step: i },
      output: isFailed ? undefined : { result: `${stepName} completed successfully` },
      error: isFailed ? { name: 'FatalError', message: `Step ${stepName} failed: upstream LLM error` } : undefined,
      children: [llmChild],
    };

    children.push(stepNode);
    currentTime = stepEnd + 100; // small gap between steps
  }

  // Generate evaluator nodes (only if not failed)
  if (!failed) {
    for (const evalName of evaluators) {
      const evalStart = currentTime;
      const evalDuration = 500 + Math.floor(pseudoRandom() * 1500);
      const evalEnd = evalStart + evalDuration;
      const passed = pseudoRandom() > 0.2;
      const confidence = 0.6 + pseudoRandom() * 0.4;

      const evalOutput: EvaluatorOutput = {
        value: passed,
        confidence: Number(confidence.toFixed(2)),
        reasoning: passed
          ? `Output meets quality criteria for ${evalName.replace('judge', '').toLowerCase()}`
          : `Output fails quality check: insufficient detail in ${evalName.replace('judge', '').toLowerCase()}`,
      };

      const evalLlmChild: TraceNode = {
        id: `generateText-eval-${evalStart}`,
        kind: 'llm',
        name: 'generateText',
        startedAt: evalStart + 20,
        endedAt: evalEnd - 20,
        input: {
          prompt: `${evalName}@v1`,
          variables: { output: 'Previous step output...' },
          loadedPrompt: { name: `${evalName}@v1`, config: { provider: 'anthropic', model: 'claude-haiku-4-20250414' } },
        },
        output: {
          result: JSON.stringify(evalOutput),
          usage: { inputTokens: 150 + Math.floor(pseudoRandom() * 300), outputTokens: 50 + Math.floor(pseudoRandom() * 100), totalTokens: 250 },
        },
        children: [],
      };

      const evalNode: TraceNode = {
        id: `eval-${evaluators.indexOf(evalName) + 1}`,
        kind: 'evaluator',
        name: `${workflowName}#${evalName}`,
        startedAt: evalStart,
        endedAt: evalEnd,
        input: { output: 'Previous step output to evaluate...' },
        output: evalOutput,
        children: [evalLlmChild],
      };

      children.push(evalNode);
      currentTime = evalEnd + 50;
    }
  }

  const rootNode: TraceNode = {
    id: workflowId,
    kind: 'workflow',
    name: workflowName,
    startedAt: startTime,
    endedAt: currentTime,
    input: { patientId: `P-${1000 + Math.floor(pseudoRandom() * 9000)}` },
    output: failed ? undefined : { result: `${workflowName} completed`, trace: { destinations: { local: `logs/runs/${workflowName}/${format(startTime, "yyyy-MM-dd")}_${workflowId}.json`, remote: null } } },
    error: failed ? { name: 'WorkflowError', message: `Workflow ${workflowName} failed at final step` } : undefined,
    children,
  };

  return rootNode;
}

// ─── Public Mock Generators (called by output-client in demo mode) ───────────

export function generateMockRuns(workflowId: string, limit: number): WorkflowRunListItem[] {
  resetSeed(workflowId.length * 12345);
  const runs: WorkflowRunListItem[] = [];
  const now = Date.now();

  for (let i = 0; i < limit; i++) {
    const startOffset = i * (3600000 + Math.floor(pseudoRandom() * 7200000)); // 1-3 hours apart
    const startTime = new Date(now - startOffset);
    const duration = 5000 + Math.floor(pseudoRandom() * 25000);
    const failed = pseudoRandom() < 0.12;
    const running = i === 0 && pseudoRandom() < 0.3;

    runs.push({
      workflowId,
      runId: uuid(),
      workflowName: workflowId,
      status: running ? 'RUNNING' : failed ? 'FAILED' : 'COMPLETED',
      startTime: startTime.toISOString(),
      closeTime: running ? undefined : new Date(startTime.getTime() + duration).toISOString(),
    });
  }

  return runs;
}

export function generateMockTrace(workflowId: string, runId: string): TraceLogResponse {
  resetSeed(runId.length * 67890 + workflowId.length);
  const failed = pseudoRandom() < 0.12;
  const startTime = Date.now() - Math.floor(pseudoRandom() * 86400000);

  return {
    workflowId,
    runId,
    trace: generateTraceTree(workflowId, startTime, failed),
  };
}

export function generateMockCatalog(): WorkflowCatalogEntry[] {
  return Object.entries(WORKFLOWS).map(([name, def]) => ({
    name,
    description: def.description,
    inputSchema: {
      type: 'object',
      properties: { patientId: { type: 'string' } },
      required: ['patientId'],
    },
    outputSchema: {
      type: 'object',
      properties: { result: { type: 'string' } },
    },
  }));
}

export function generateMockCostEvents(): CostLlmEvent[] {
  resetSeed(42);
  const events: CostLlmEvent[] = [];
  const now = Date.now();
  const workflowNames = Object.keys(WORKFLOWS);

  for (let day = 0; day < 30; day++) {
    const executionsPerDay = 5 + Math.floor(pseudoRandom() * 15);
    for (let exec = 0; exec < executionsPerDay; exec++) {
      const wfName = pickRandom(workflowNames);
      const provider = pickRandom(PROVIDERS);
      const model = pickRandom(MODELS[provider]);
      const inputTokens = 200 + Math.floor(pseudoRandom() * 2000);
      const outputTokens = 100 + Math.floor(pseudoRandom() * 1000);

      // Realistic cost calculation
      const costPerInputToken = model.includes('haiku') || model.includes('mini') ? 0.00000025 : 0.000003;
      const costPerOutputToken = model.includes('haiku') || model.includes('mini') ? 0.00000125 : 0.000015;

      events.push({
        eventId: uuid(),
        workflowId: wfName,
        runId: uuid(),
        activityId: `step-${Math.floor(pseudoRandom() * 4) + 1}`,
        provider,
        model,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        estimatedCost: inputTokens * costPerInputToken + outputTokens * costPerOutputToken,
        timestamp: now - day * 86400000 - Math.floor(pseudoRandom() * 86400000),
      });
    }
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}
