import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generateExecutions } from '@/data/mock-data';
import type { StepExecution, WorkflowExecution } from '@/types';

export type LiveEventType =
  | 'execution_started'
  | 'execution_completed'
  | 'execution_failed'
  | 'step_completed'
  | 'step_failed';

export interface LiveEventDetails {
  stepName?: string;
  duration?: number;
  totalTokens?: number;
  totalCost?: number;
  model?: string;
  provider?: WorkflowExecution['provider'];
  status?: WorkflowExecution['status'] | StepExecution['status'];
  retryCount?: number;
  error?: string;
}

export interface LiveEvent {
  id: string;
  type: LiveEventType;
  timestamp: Date;
  workflowName: string;
  executionId: string;
  details: LiveEventDetails;
}

const LIVE_EVENT_TYPES: LiveEventType[] = [
  'execution_started',
  'execution_completed',
  'execution_failed',
  'step_completed',
  'step_failed',
];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(items: T[]): T {
  return items[randomBetween(0, items.length - 1)];
}

function createEventId(): string {
  return `live_${Math.random().toString(36).slice(2, 10)}`;
}

function pickStep(execution: WorkflowExecution, type: LiveEventType): StepExecution {
  const completedSteps = execution.steps.filter(step => step.status === 'completed' || step.status === 'cached');
  const failedSteps = execution.steps.filter(step => step.status === 'failed');

  if (type === 'step_completed' && completedSteps.length > 0) {
    return randomPick(completedSteps);
  }

  if (type === 'step_failed' && failedSteps.length > 0) {
    return randomPick(failedSteps);
  }

  return randomPick(execution.steps);
}

function createLiveEvent(executions: WorkflowExecution[]): LiveEvent {
  const type = randomPick(LIVE_EVENT_TYPES);
  const execution = randomPick(executions);
  const step = pickStep(execution, type);

  switch (type) {
    case 'execution_started':
      return {
        id: createEventId(),
        type,
        timestamp: new Date(),
        workflowName: execution.workflowName,
        executionId: execution.id,
        details: {
          status: 'running',
          model: execution.model,
          provider: execution.provider,
        },
      };

    case 'execution_completed':
      return {
        id: createEventId(),
        type,
        timestamp: new Date(),
        workflowName: execution.workflowName,
        executionId: execution.id,
        details: {
          status: 'completed',
          duration: execution.duration ?? randomBetween(1500, 12000),
          totalTokens: execution.totalTokens,
          totalCost: execution.totalCost,
          model: execution.model,
          provider: execution.provider,
        },
      };

    case 'execution_failed':
      return {
        id: createEventId(),
        type,
        timestamp: new Date(),
        workflowName: execution.workflowName,
        executionId: execution.id,
        details: {
          status: 'failed',
          stepName: step.name,
          duration: execution.duration ?? step.duration,
          retryCount: step.retryCount,
          error: 'Provider timeout while processing execution.',
        },
      };

    case 'step_completed':
      return {
        id: createEventId(),
        type,
        timestamp: new Date(),
        workflowName: execution.workflowName,
        executionId: execution.id,
        details: {
          stepName: step.name,
          duration: step.duration ?? randomBetween(150, 3000),
          status: step.status,
        },
      };

    case 'step_failed':
      return {
        id: createEventId(),
        type,
        timestamp: new Date(),
        workflowName: execution.workflowName,
        executionId: execution.id,
        details: {
          stepName: step.name,
          duration: step.duration ?? randomBetween(150, 3000),
          status: 'failed',
          retryCount: step.retryCount,
          error: 'Step returned an error response.',
        },
      };
  }
}

export function useLiveMode() {
  const [isLive, setIsLive] = useState(false);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const timerRef = useRef<number | null>(null);
  const executionPool = useMemo(() => generateExecutions(100), []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const toggleLive = useCallback(() => {
    setIsLive(current => !current);
  }, []);

  useEffect(() => {
    if (!isLive) {
      clearTimer();
      return;
    }

    const scheduleNextEvent = () => {
      timerRef.current = window.setTimeout(() => {
        setEvents(currentEvents => [createLiveEvent(executionPool), ...currentEvents].slice(0, 50));
        scheduleNextEvent();
      }, randomBetween(2000, 4000));
    };

    scheduleNextEvent();

    return clearTimer;
  }, [clearTimer, executionPool, isLive]);

  useEffect(() => clearTimer, [clearTimer]);

  return { isLive, toggleLive, events };
}
