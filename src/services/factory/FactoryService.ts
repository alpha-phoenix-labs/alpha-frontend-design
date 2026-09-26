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
  readonly submitApproval: (jobId: string) => Promise<FactoryResult<HumanGateState>>;
  /** Cumulative production metrics of the job's workflow; `totalCostMicros` equals `apiCostMicros + platformCostMicros`. */
  readonly getProductionMetrics: (jobId: string) => Promise<FactoryResult<WorkflowProductionMetrics | null>>;
}
