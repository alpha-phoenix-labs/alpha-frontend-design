import type {
  FactoryJob,
  FactoryResult,
  HumanGateState,
  TestResult,
  WorkflowExecutionResult,
  WorkflowGenerationResult,
  WorkflowProductionMetrics,
  WorkflowRequest,
} from '@/types/factory/index.ts';

/** Input of {@link FactoryService.submitApproval}. */
export interface SubmitApprovalInput {
  readonly jobId: string;
  /** Job version the decision refers to; a stale version is rejected with `VERSION_CONFLICT`. */
  readonly version: number;
  readonly approve: boolean;
}

/** Input of {@link FactoryService.submitClarification}. */
export interface SubmitClarificationInput {
  readonly jobId: string;
  readonly response: string;
}

/**
 * Contract of the factory backend as seen by the UI. Implementations never throw;
 * every failure is returned as `{ ok: false, error }`. `null` values mean "not available yet".
 */
export interface FactoryService {
  readonly submitWorkflowRequest: (request: WorkflowRequest) => Promise<FactoryResult<FactoryJob>>;
  readonly getJobStatus: (jobId: string) => Promise<FactoryResult<FactoryJob>>;
  readonly getGeneratedWorkflow: (jobId: string) => Promise<FactoryResult<WorkflowGenerationResult | null>>;
  readonly getTestStatus: (jobId: string) => Promise<FactoryResult<TestResult | null>>;
  readonly getExecutionStatus: (jobId: string) => Promise<FactoryResult<WorkflowExecutionResult | null>>;
  readonly getHumanGateState: (jobId: string) => Promise<FactoryResult<HumanGateState | null>>;
  /** Approves (`approve: true`) or rejects the approval gate at the given job version; returns the updated job. */
  readonly submitApproval: (input: SubmitApprovalInput) => Promise<FactoryResult<FactoryJob>>;
  /** Answers the clarification gate of a job; returns the updated job. */
  readonly submitClarification: (input: SubmitClarificationInput) => Promise<FactoryResult<FactoryJob>>;
  /** Cumulative production metrics of the job's workflow; `totalCostMicros` equals `apiCostMicros + platformCostMicros`. */
  readonly getProductionMetrics: (jobId: string) => Promise<FactoryResult<WorkflowProductionMetrics | null>>;
}
