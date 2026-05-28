import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkflowData } from '@/hooks/useWorkflowData';

describe('useWorkflowData', () => {
  it('initializes with executions', () => {
    const { result } = renderHook(() => useWorkflowData());
    expect(result.current.executions.length).toBeGreaterThan(0);
    expect(result.current.allExecutions.length).toBe(500);
  });

  it('filters by status', () => {
    const { result } = renderHook(() => useWorkflowData());
    act(() => {
      result.current.setStatusFilter('completed');
    });
    result.current.executions.forEach(exec => {
      expect(exec.status).toBe('completed');
    });
  });

  it('filters by workflow name', () => {
    const { result } = renderHook(() => useWorkflowData());
    const targetWorkflow = result.current.workflowNames[0];
    act(() => {
      result.current.setWorkflowFilter(targetWorkflow);
    });
    result.current.executions.forEach(exec => {
      expect(exec.workflowName).toBe(targetWorkflow);
    });
  });

  it('filters by search query', () => {
    const { result } = renderHook(() => useWorkflowData());
    act(() => {
      result.current.setSearchQuery('research');
    });
    result.current.executions.forEach(exec => {
      expect(exec.workflowName.toLowerCase()).toContain('research');
    });
  });

  it('computes stats correctly', () => {
    const { result } = renderHook(() => useWorkflowData());
    expect(result.current.stats.totalExecutions).toBe(500);
    expect(result.current.stats.successRate).toBeGreaterThan(0);
    expect(result.current.stats.successRate).toBeLessThanOrEqual(1);
    expect(result.current.stats.totalCost).toBeGreaterThan(0);
  });

  it('selects and deselects execution', () => {
    const { result } = renderHook(() => useWorkflowData());
    const exec = result.current.executions[0];
    act(() => {
      result.current.selectExecution(exec);
    });
    expect(result.current.selectedExecution).toBe(exec);
    act(() => {
      result.current.selectExecution(null);
    });
    expect(result.current.selectedExecution).toBeNull();
  });
});
