import { WorkflowExecution, StepExecution, Trace, CostBreakdown } from '@/types';
import { subHours, subMinutes, subDays, format } from 'date-fns';

// ─── Demo Scenario: Meridian Health ───────────────────────────────────────────
// A healthtech company using Output.ai to automate clinical documentation,
// patient intake, insurance processing, and care coordination workflows.

const WORKFLOW_NAMES = [
  'patient_intake',
  'clinical_notes',
  'insurance_verify',
  'lab_results',
  'referral_router',
  'discharge_summary',
  'prior_auth',
  'appointment_prep',
  'rx_review',
  'care_plan',
];

const STEP_NAMES: Record<string, string[]> = {
  patient_intake: ['parseFormData', 'verifyIdentity', 'matchMedicalRecord', 'flagAlerts'],
  clinical_notes: ['transcribeVisit', 'extractDiagnoses', 'codeProcedures', 'generateNote'],
  insurance_verify: ['lookupPlan', 'checkEligibility', 'validateCoverage', 'returnBenefits'],
  lab_results: ['parseHL7', 'normalizeValues', 'flagAbnormals', 'notifyProvider'],
  referral_router: ['classifySpecialty', 'checkAvailability', 'matchProvider', 'sendReferral'],
  discharge_summary: ['aggregateVisit', 'summarizeTreatment', 'listMedications', 'generateInstructions'],
  prior_auth: ['extractClinicalInfo', 'matchCriteria', 'generateLetter', 'submitToPayor'],
  appointment_prep: ['pullHistory', 'summarizeRecent', 'flagOverdue', 'prepBrief'],
  rx_review: ['parsePrescriptions', 'checkInteractions', 'verifyDosage', 'flagContraindications'],
  care_plan: ['assessConditions', 'setGoals', 'recommendInterventions', 'scheduleFollowups'],
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
  (step: string) => `You are a clinical ${step} specialist. Process the following patient data according to HIPAA-compliant guidelines.\n\nContext: Apply ${step} logic to the structured health record.\nFormat: FHIR-compatible JSON\nMax tokens: 2048`,
  (step: string) => `You are an expert medical ${step} agent. Carefully analyze the provided clinical input and return a structured result.\n\nInstructions:\n1. Parse patient data thoroughly\n2. Apply ${step} validation rules\n3. Return JSON with confidence scores and ICD-10 codes where applicable\n\nBe precise and cite clinical evidence.`,
  (step: string) => `System: You are a specialized healthcare ${step} processor.\nRole: Clinical informatics analyst\nObjective: Extract structured medical insights from the given record.\n\nRules:\n- Output must be FHIR R4 compliant JSON\n- Include provenance metadata\n- Flag any clinical safety concerns during ${step}`,
  (step: string) => `[${step.toUpperCase()}] Process the following clinical data.\n\nYou must:\n- Analyze for medical relevance and completeness\n- Validate against CMS guidelines\n- Score confidence on a 0-100 scale\n- Return structured JSON with audit trail\n\nTemperature: 0.2\nModel behavior: deterministic, safety-first`,
  (step: string) => `As a ${step} specialist in healthcare AI, evaluate the following:\n\nPriority: patient safety over throughput\nOutput schema: { "result": object, "confidence": number, "flags": string[], "icdCodes": string[] }\n\nProcess step: ${step}\nCompliance: HIPAA, HL7 FHIR R4\nVersion: 3.2.1`,
];

const RESPONSE_VARIATIONS = [
  (step: string, confidence: number) => `{"result": {"status": "processed", "step": "${step}"}, "confidence": ${confidence}, "flags": [], "auditId": "aud_${randomBetween(10000, 99999)}"}`,
  (step: string, confidence: number) => `{\n  "result": "${step} validation passed",\n  "confidence": ${confidence},\n  "details": {\n    "recordsProcessed": ${randomBetween(1, 8)},\n    "warnings": ${randomBetween(0, 2)},\n    "complianceCheck": "passed"\n  }\n}`,
  (step: string, confidence: number) => `{"status": "complete", "step": "${step}", "output": {"score": ${confidence}, "icdCodes": ["Z00.00", "R69"], "summary": "Clinical data processed successfully"}}`,
  (step: string, confidence: number) => `{\n  "result": "Completed ${step}",\n  "confidence": ${confidence / 100},\n  "metadata": {\n    "fhirVersion": "R4",\n    "tokens_used": ${randomBetween(200, 1500)},\n    "latency_ms": ${randomBetween(80, 600)},\n    "phi_detected": false\n  },\n  "output": "Structured clinical output ready"\n}`,
  (step: string, confidence: number) => `{"step": "${step}", "status": "done", "confidence": ${confidence}, "findings": ["Primary analysis complete", "No safety flags", "${randomBetween(1, 5)} clinical items validated"], "nextAction": "route_to_provider"}`,
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
      evaluatorName: `check_${name}_compliance`,
      passed: Math.random() > 0.2,
      confidence: randomBetween(60, 99),
      reasoning: `Clinical output meets compliance threshold with ${randomBetween(3, 8)} validation checks passed.`,
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
      input: { patientId: `MRN-${randomBetween(100000, 999999)}`, encounter: `enc_${randomBetween(1000, 9999)}` },
      output: status === 'completed' ? { result: 'Processed', recordId: `rec_${randomBetween(10000, 99999)}` } : undefined,
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
