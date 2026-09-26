import { useShallow } from 'zustand/react/shallow';
import type {
  ApiError,
  FactoryJob,
  HumanGateState,
  JobStatus,
  ProductionCost,
  TestResult,
  WorkflowExecutionResult,
  WorkflowGenerationResult,
} from '@/types/factory/index.ts';
import { useFactoryStore, type FactoryState } from '@/store/factory/factoryStore.ts';

const lookup = <T>(byId: Readonly<Record<string, T>>, jobId: string | null): T | null =>
  jobId === null ? null : (byId[jobId] ?? null);

export const selectFactoryJobIds = (state: FactoryState): readonly string[] => state.jobIds;
export const selectActiveFactoryJobId = (state: FactoryState): string | null => state.activeJobId;
export const selectFactoryLastError = (state: FactoryState): ApiError | null => state.lastError;
export const selectFactoryJob = (jobId: string | null) => (state: FactoryState): FactoryJob | null =>
  lookup(state.jobs, jobId);
/** Status of a job; `idle` when no job exists for the id. */
export const selectFactoryJobStatus = (jobId: string | null) => (state: FactoryState): JobStatus =>
  lookup(state.jobs, jobId)?.status ?? 'idle';
export const selectActiveFactoryJob = (state: FactoryState): FactoryJob | null => lookup(state.jobs, state.activeJobId);

export const useFactoryJobIds = (): readonly string[] => useFactoryStore(selectFactoryJobIds);
export const useActiveFactoryJobId = (): string | null => useFactoryStore(selectActiveFactoryJobId);
export const useActiveFactoryJob = (): FactoryJob | null => useFactoryStore(selectActiveFactoryJob);
export const useFactoryLastError = (): ApiError | null => useFactoryStore(selectFactoryLastError);
export const useFactoryJob = (jobId: string | null): FactoryJob | null =>
  useFactoryStore((state) => lookup(state.jobs, jobId));
export const useFactoryJobStatus = (jobId: string | null): JobStatus =>
  useFactoryStore((state) => lookup(state.jobs, jobId)?.status ?? 'idle');
export const useWorkflowGenerationResult = (jobId: string | null): WorkflowGenerationResult | null =>
  useFactoryStore((state) => lookup(state.generationResults, jobId));
export const useTestResult = (jobId: string | null): TestResult | null =>
  useFactoryStore((state) => lookup(state.testResults, jobId));
export const useWorkflowExecutionResult = (jobId: string | null): WorkflowExecutionResult | null =>
  useFactoryStore((state) => lookup(state.executionResults, jobId));
export const useHumanGateState = (jobId: string | null): HumanGateState | null =>
  useFactoryStore((state) => lookup(state.humanGates, jobId));
export const useProductionCost = (jobId: string | null): ProductionCost | null =>
  useFactoryStore((state) => lookup(state.productionCosts, jobId));

export type FactoryActions = Pick<
  FactoryState,
  'submitWorkflowRequest' | 'refreshJob' | 'submitApproval' | 'setActiveJob' | 'clearLastError'
>;

export const useFactoryActions = (): FactoryActions =>
  useFactoryStore(
    useShallow((state) => ({
      submitWorkflowRequest: state.submitWorkflowRequest,
      refreshJob: state.refreshJob,
      submitApproval: state.submitApproval,
      setActiveJob: state.setActiveJob,
      clearLastError: state.clearLastError,
    })),
  );
