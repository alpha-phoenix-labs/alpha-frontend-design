import { useShallow } from 'zustand/react/shallow';
import type {
  ApiError,
  FactoryJob,
  HumanGateState,
  JobStatus,
  TestResult,
  WorkflowExecutionResult,
  WorkflowGenerationResult,
  WorkflowProductionMetrics,
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
export const selectProductionMetrics = (jobId: string | null) => (state: FactoryState): WorkflowProductionMetrics | null =>
  lookup(state.productionMetrics, jobId);
export const selectActiveProductionMetrics = (state: FactoryState): WorkflowProductionMetrics | null =>
  lookup(state.productionMetrics, state.activeJobId);
/** Metrics of the job that produced the given workflow; returns the stored object, never a copy. */
export const selectProductionMetricsByWorkflowId = (workflowId: string | null) => (state: FactoryState): WorkflowProductionMetrics | null => {
  if (workflowId === null) {
    return null;
  }
  for (const jobId of state.jobIds) {
    const metrics = state.productionMetrics[jobId];
    if (metrics?.workflowId === workflowId) {
      return metrics;
    }
  }
  return null;
};
/** Sum of the total production cost of all jobs, in micros. */
export const selectTotalProductionCostMicros = (state: FactoryState): number =>
  state.jobIds.reduce((sum, jobId) => sum + (state.productionMetrics[jobId]?.totalCostMicros ?? 0), 0);

/** Cost fields of {@link WorkflowProductionMetrics}. */
export type ProductionCostFigures = Pick<
  WorkflowProductionMetrics,
  'currency' | 'apiCostMicros' | 'platformCostMicros' | 'totalCostMicros'
>;

/** Test fields of {@link WorkflowProductionMetrics}. */
export type ProductionTestFigures = Pick<
  WorkflowProductionMetrics,
  'testMode' | 'testCount' | 'passed' | 'failed' | 'retryLoops' | 'repairLoops'
>;

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
export const useProductionMetrics = (jobId: string | null): WorkflowProductionMetrics | null =>
  useFactoryStore((state) => lookup(state.productionMetrics, jobId));
export const useActiveProductionMetrics = (): WorkflowProductionMetrics | null =>
  useFactoryStore(selectActiveProductionMetrics);
export const useProductionMetricsByWorkflowId = (workflowId: string | null): WorkflowProductionMetrics | null =>
  useFactoryStore(selectProductionMetricsByWorkflowId(workflowId));
export const useTotalProductionCostMicros = (): number => useFactoryStore(selectTotalProductionCostMicros);
/** Cost fields of a job's metrics; re-renders only when one of them changes. */
export const useProductionCostFigures = (jobId: string | null): ProductionCostFigures | null =>
  useFactoryStore(
    useShallow((state) => {
      const metrics = lookup(state.productionMetrics, jobId);
      return metrics === null
        ? null
        : {
            currency: metrics.currency,
            apiCostMicros: metrics.apiCostMicros,
            platformCostMicros: metrics.platformCostMicros,
            totalCostMicros: metrics.totalCostMicros,
          };
    }),
  );
/** Test fields of a job's metrics; re-renders only when one of them changes. */
export const useProductionTestFigures = (jobId: string | null): ProductionTestFigures | null =>
  useFactoryStore(
    useShallow((state) => {
      const metrics = lookup(state.productionMetrics, jobId);
      return metrics === null
        ? null
        : {
            testMode: metrics.testMode,
            testCount: metrics.testCount,
            passed: metrics.passed,
            failed: metrics.failed,
            retryLoops: metrics.retryLoops,
            repairLoops: metrics.repairLoops,
          };
    }),
  );

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
