import { describe, it, expect } from 'vitest';
import { generateExecutions, generateCostBreakdown } from '@/data/mock-data';

describe('generateExecutions', () => {
  it('generates the requested number of executions', () => {
    const executions = generateExecutions(100);
    expect(executions).toHaveLength(100);
  });

  it('each execution has required fields', () => {
    const executions = generateExecutions(10);
    executions.forEach(exec => {
      expect(exec.id).toBeDefined();
      expect(exec.workflowName).toBeDefined();
      expect(exec.status).toMatch(/^(running|completed|failed|retrying)$/);
      expect(exec.startedAt).toBeInstanceOf(Date);
      expect(exec.steps.length).toBeGreaterThan(0);
      expect(typeof exec.totalTokens).toBe('number');
      expect(typeof exec.totalCost).toBe('number');
      expect(exec.provider).toMatch(/^(anthropic|openai|azure|vertex)$/);
    });
  });

  it('executions are sorted by startedAt descending', () => {
    const executions = generateExecutions(50);
    for (let i = 1; i < executions.length; i++) {
      expect(executions[i - 1].startedAt.getTime()).toBeGreaterThanOrEqual(
        executions[i].startedAt.getTime()
      );
    }
  });

  it('steps have traces', () => {
    const executions = generateExecutions(20);
    executions.forEach(exec => {
      exec.steps.forEach(step => {
        expect(step.traces.length).toBeGreaterThan(0);
        step.traces.forEach(trace => {
          expect(trace.type).toMatch(/^(llm|http|tool|eval)$/);
          expect(typeof trace.duration).toBe('number');
          expect(trace.status).toMatch(/^(success|error)$/);
        });
      });
    });
  });
});

describe('generateCostBreakdown', () => {
  it('generates the requested number of days', () => {
    const data = generateCostBreakdown(30);
    expect(data).toHaveLength(30);
  });

  it('each entry has required fields', () => {
    const data = generateCostBreakdown(7);
    data.forEach(entry => {
      expect(entry.date).toBeDefined();
      expect(typeof entry.inputCost).toBe('number');
      expect(typeof entry.outputCost).toBe('number');
      expect(typeof entry.totalCost).toBe('number');
      expect(typeof entry.totalTokens).toBe('number');
      expect(typeof entry.executions).toBe('number');
      expect(entry.totalCost).toBeCloseTo(entry.inputCost + entry.outputCost, 1);
    });
  });
});
