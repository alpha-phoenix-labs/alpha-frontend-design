import type { IsoTimestamp } from '@/types/common.ts';
import type { ApiError } from '@/types/factory/apiError.ts';
import type { JobStatus } from '@/types/factory/jobStatus.ts';
import type { TestMode } from '@/types/factory/productionMetrics.ts';

/** Request to generate a workflow from a natural-language description. */
export interface WorkflowRequest {
  readonly description: string;
  readonly testMode: TestMode;
}

/** A factory job and its current status. */
export interface FactoryJob {
  readonly id: string;
  readonly status: JobStatus;
  readonly request: WorkflowRequest;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
  /** Present when the job ended in or passed through an error. */
  readonly error?: ApiError;
}

/** Outcome of workflow generation for a job. The workflow definition itself stays opaque to the UI. */
export interface WorkflowGenerationResult {
  readonly jobId: string;
  readonly workflowId: string;
  readonly generatedAt: IsoTimestamp;
}

/** Test run summary for a generated workflow. */
export interface TestResult {
  readonly jobId: string;
  readonly testMode: TestMode;
  readonly testCount: number;
  readonly passed: number;
  readonly failed: number;
  readonly retryLoops: number;
  readonly repairLoops: number;
  /** Set once the test run has finished. */
  readonly completedAt?: IsoTimestamp;
}

/** Execution state of a workflow run; status uses the central {@link JobStatus}. */
export interface WorkflowExecutionResult {
  readonly jobId: string;
  readonly executionId: string;
  readonly status: JobStatus;
  readonly startedAt: IsoTimestamp;
  readonly finishedAt?: IsoTimestamp;
  readonly error?: ApiError;
}

/** Job statuses relevant to the human approval gate. */
export type HumanGateStatus = Extract<JobStatus, 'awaiting_human' | 'approved'>;

/** Human approval gate for a job; discriminated by `status`. */
export type HumanGateState =
  | {
      readonly jobId: string;
      readonly status: 'awaiting_human';
      readonly requestedAt: IsoTimestamp;
    }
  | {
      readonly jobId: string;
      readonly status: 'approved';
      readonly requestedAt: IsoTimestamp;
      readonly approvedAt: IsoTimestamp;
    };
