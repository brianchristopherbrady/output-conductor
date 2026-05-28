import { useState, useMemo, useCallback } from 'react';
import { WorkflowExecution, ViewMode } from '@/types';
import { generateExecutions, generateCostBreakdown } from '@/data/mock-data';

export function useWorkflowData() {
  const [executions] = useState<WorkflowExecution[]>(() => generateExecutions(500));
  const [costData] = useState(() => generateCostBreakdown(30));
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');

  const filteredExecutions = useMemo(() => {
    return executions.filter(exec => {
      if (statusFilter !== 'all' && exec.status !== statusFilter) return false;
      if (workflowFilter !== 'all' && exec.workflowName !== workflowFilter) return false;
      if (searchQuery && !exec.workflowName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !exec.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [executions, statusFilter, workflowFilter, searchQuery]);

  const stats = useMemo(() => {
    const completed = executions.filter(e => e.status === 'completed').length;
    return {
      totalExecutions: executions.length,
      successRate: completed / executions.length,
      avgDuration: executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length,
      totalCost: executions.reduce((sum, e) => sum + e.totalCost, 0),
      totalTokens: executions.reduce((sum, e) => sum + e.totalTokens, 0),
      avgTokensPerExecution: executions.reduce((sum, e) => sum + e.totalTokens, 0) / executions.length,
    };
  }, [executions]);

  const workflowNames = useMemo(() => {
    return [...new Set(executions.map(e => e.workflowName))].sort();
  }, [executions]);

  const selectExecution = useCallback((exec: WorkflowExecution | null) => {
    setSelectedExecution(exec);
  }, []);

  return {
    executions: filteredExecutions,
    allExecutions: executions,
    costData,
    selectedExecution,
    selectExecution,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    workflowFilter,
    setWorkflowFilter,
    stats,
    workflowNames,
  };
}
