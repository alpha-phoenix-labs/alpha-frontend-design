import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import type {
  ApiError,
  FactoryJob,
  FactoryResult,
  HumanGateState,
  TestResult,
  WorkflowExecutionResult,
  WorkflowGenerationResult,
  WorkflowProductionMetrics,
  WorkflowRequest,
} from '@/types/factory/index.ts';
import {
  getFactoryService,
  type FactoryService,
  type SubmitApprovalInput,
  type SubmitClarificationInput,
} from '@/services/factory/index.ts';

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
  /** Production metrics per job; an entry keeps its reference while the values are unchanged. */
  readonly productionMetrics: ById<WorkflowProductionMetrics>;
  readonly lastError: ApiError | null;
  /** Submits a request, stores the new job and makes it the active job. */
  readonly submitWorkflowRequest: (request: WorkflowRequest) => Promise<FactoryResult<FactoryJob>>;
  /** Reloads the job and every result that is available for it. */
  readonly refreshJob: (jobId: string) => Promise<void>;
  /** Decides the approval gate of a job and stores the updated job; on a version conflict the job is refreshed. */
  readonly submitApproval: (input: SubmitApprovalInput) => Promise<FactoryResult<FactoryJob>>;
  /** Answers the clarification gate of a job and stores the updated job; on a version conflict the job is refreshed. */
  readonly submitClarification: (input: SubmitClarificationInput) => Promise<FactoryResult<FactoryJob>>;
  readonly setActiveJob: (jobId: string | null) => void;
  readonly clearLastError: () => void;
}

/** Creates a factory store bound to the given service. */
export function createFactoryStore(service: FactoryService) {
  return create<FactoryState>()((set, get) => {
    const applyResult = <T>(result: FactoryResult<T | null>, apply: (value: T) => void): void => {
      if (!result.ok) {
        set({ lastError: result.error });
      } else if (result.value !== null) {
        apply(result.value);
      }
    };

    /** Stores a job unless a newer version of it is already stored (out-of-order responses). */
    const storeJob = (job: FactoryJob): void =>
      set((state) => {
        const stored = state.jobs[job.id];
        if (stored !== undefined && stored.version > job.version) {
          return state;
        }
        return {
          jobs: { ...state.jobs, [job.id]: job },
          jobIds: state.jobIds.includes(job.id) ? state.jobIds : [...state.jobIds, job.id],
        };
      });

    /** Stores the job of a gate decision; after a version conflict the current job is reloaded. */
    const applyGateResult = async (jobId: string, result: FactoryResult<FactoryJob>): Promise<void> => {
      if (result.ok) {
        storeJob(result.value);
        return;
      }
      set({ lastError: result.error });
      if (result.error.code === 'VERSION_CONFLICT') {
        await get().refreshJob(jobId);
      }
    };

    return {
      jobs: {},
      jobIds: [],
      activeJobId: null,
      generationResults: {},
      testResults: {},
      executionResults: {},
      humanGates: {},
      productionMetrics: {},
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
        const [job, generation, test, execution, gate, metrics] = await Promise.all([
          service.getJobStatus(jobId),
          service.getGeneratedWorkflow(jobId),
          service.getTestStatus(jobId),
          service.getExecutionStatus(jobId),
          service.getHumanGateState(jobId),
          service.getProductionMetrics(jobId),
        ]);
        if (!job.ok) {
          set({ lastError: job.error });
          return;
        }
        const storedJob = get().jobs[jobId];
        if (storedJob !== undefined && storedJob.version > job.value.version) {
          // Snapshot consistency: never apply companion state from an older job version.
          return;
        }
        storeJob(job.value);
        applyResult(generation, (value) =>
          set((state) => ({ generationResults: { ...state.generationResults, [jobId]: value } })),
        );
        applyResult(test, (value) => set((state) => ({ testResults: { ...state.testResults, [jobId]: value } })));
        applyResult(execution, (value) =>
          set((state) => ({ executionResults: { ...state.executionResults, [jobId]: value } })),
        );
        if (gate.ok && gate.value === null) {
          // A closed gate removes the stored entry; on error the entry stays unchanged.
          set((state) => {
            if (!(jobId in state.humanGates)) {
              return state;
            }
            const { [jobId]: _removed, ...humanGates } = state.humanGates;
            return { humanGates };
          });
        } else {
          applyResult(gate, (value) => set((state) => ({ humanGates: { ...state.humanGates, [jobId]: value } })));
        }
        applyResult(metrics, (value) =>
          set((state) =>
            shallow(state.productionMetrics[jobId], value)
              ? state
              : { productionMetrics: { ...state.productionMetrics, [jobId]: value } },
          ),
        );
      },
      submitApproval: async (input) => {
        const result = await service.submitApproval(input);
        await applyGateResult(input.jobId, result);
        return result;
      },
      submitClarification: async (input) => {
        const result = await service.submitClarification(input);
        await applyGateResult(input.jobId, result);
        return result;
      },
      setActiveJob: (jobId) => set({ activeJobId: jobId }),
      clearLastError: () => set({ lastError: null }),
    };
  });
}

/** Application-wide factory store, bound to the centrally selected factory service. */
export const useFactoryStore = createFactoryStore(getFactoryService());
