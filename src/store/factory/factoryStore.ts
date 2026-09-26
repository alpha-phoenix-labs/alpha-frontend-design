import { create } from 'zustand';
import type {
  ApiError,
  FactoryJob,
  FactoryResult,
  HumanGateState,
  ProductionCost,
  TestResult,
  WorkflowExecutionResult,
  WorkflowGenerationResult,
  WorkflowRequest,
} from '@/types/factory/index.ts';
import { getFactoryService, type FactoryService } from '@/services/factory/index.ts';

type ById<T> = Readonly<Record<string, T>>;

/** Factory jobs and their results, keyed by job id. */
export interface FactoryState {
  readonly jobs: ById<FactoryJob>;
  /** Job ids in submission order. */
  readonly jobIds: readonly string[];
  readonly activeJobId: string | null;
  readonly generationResults: ById<WorkflowGenerationResult>;
  readonly testResults: ById<TestResult>;
  readonly executionResults: ById<WorkflowExecutionResult>;
  readonly humanGates: ById<HumanGateState>;
  readonly productionCosts: ById<ProductionCost>;
  readonly lastError: ApiError | null;
  /** Submits a request, stores the new job and makes it the active job. */
  readonly submitWorkflowRequest: (request: WorkflowRequest) => Promise<FactoryResult<FactoryJob>>;
  /** Reloads the job and every result that is available for it. */
  readonly refreshJob: (jobId: string) => Promise<void>;
  /** Approves the human gate of a job and stores the resulting gate state. */
  readonly submitApproval: (jobId: string) => Promise<FactoryResult<HumanGateState>>;
  readonly setActiveJob: (jobId: string | null) => void;
  readonly clearLastError: () => void;
}

/** Creates a factory store bound to the given service. */
export function createFactoryStore(service: FactoryService) {
  return create<FactoryState>()((set) => {
    const applyResult = <T>(result: FactoryResult<T | null>, apply: (value: T) => void): void => {
      if (!result.ok) {
        set({ lastError: result.error });
      } else if (result.value !== null) {
        apply(result.value);
      }
    };

    const storeJob = (job: FactoryJob): void =>
      set((state) => ({
        jobs: { ...state.jobs, [job.id]: job },
        jobIds: state.jobIds.includes(job.id) ? state.jobIds : [...state.jobIds, job.id],
      }));

    return {
      jobs: {},
      jobIds: [],
      activeJobId: null,
      generationResults: {},
      testResults: {},
      executionResults: {},
      humanGates: {},
      productionCosts: {},
      lastError: null,
      submitWorkflowRequest: async (request) => {
        const result = await service.submitWorkflowRequest(request);
        if (result.ok) {
          storeJob(result.value);
          set({ activeJobId: result.value.id });
        } else {
          set({ lastError: result.error });
        }
        return result;
      },
      refreshJob: async (jobId) => {
        const [job, generation, test, execution, gate, cost] = await Promise.all([
          service.getJobStatus(jobId),
          service.getGeneratedWorkflow(jobId),
          service.getTestStatus(jobId),
          service.getExecutionStatus(jobId),
          service.getHumanGateState(jobId),
          service.getProductionCost(jobId),
        ]);
        if (job.ok) {
          storeJob(job.value);
        } else {
          set({ lastError: job.error });
        }
        applyResult(generation, (value) =>
          set((state) => ({ generationResults: { ...state.generationResults, [jobId]: value } })),
        );
        applyResult(test, (value) => set((state) => ({ testResults: { ...state.testResults, [jobId]: value } })));
        applyResult(execution, (value) =>
          set((state) => ({ executionResults: { ...state.executionResults, [jobId]: value } })),
        );
        applyResult(gate, (value) => set((state) => ({ humanGates: { ...state.humanGates, [jobId]: value } })));
        applyResult(cost, (value) =>
          set((state) => ({ productionCosts: { ...state.productionCosts, [jobId]: value } })),
        );
      },
      submitApproval: async (jobId) => {
        const result = await service.submitApproval(jobId);
        applyResult(result, (value) => set((state) => ({ humanGates: { ...state.humanGates, [jobId]: value } })));
        return result;
      },
      setActiveJob: (jobId) => set({ activeJobId: jobId }),
      clearLastError: () => set({ lastError: null }),
    };
  });
}

/** Application-wide factory store, bound to the centrally selected factory service. */
export const useFactoryStore = createFactoryStore(getFactoryService());
