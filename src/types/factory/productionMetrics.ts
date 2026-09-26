import type { IsoTimestamp } from '@/types/common.ts';

/**
 * Environment a workflow's tests run against:
 * - `mock`: external nodes and credentials are simulated; nothing leaves the factory.
 * - `dry_run`: real nodes are executed, but writing side effects are suppressed.
 * - `live`: tests run against the real target systems.
 */
export type TestMode = 'mock' | 'dry_run' | 'live';

/** Currency of all monetary amounts in the factory contract. */
export type CostCurrency = 'USD';

/** Monetary amounts are integers in micro-units of {@link CostCurrency}: 1 USD = 1_000_000 micros. */
export const MICROS_PER_CURRENCY_UNIT = 1_000_000;

/**
 * Production metrics of the workflow produced by one factory job. Values are cumulative since submission
 * and only grow while the job runs. Money is an integer in micros of `currency`; durations are milliseconds.
 */
export interface WorkflowProductionMetrics {
  readonly jobId: string;
  /** Id of the generated workflow; set once generation has finished. */
  readonly workflowId?: string;
  readonly currency: CostCurrency;
  /** Model API cost (API-Kosten) in micros. */
  readonly apiCostMicros: number;
  /** Platform share (compute, test execution) in micros. */
  readonly platformCostMicros: number;
  /** Total production cost (Gesamtproduktionskosten) in micros; always `apiCostMicros + platformCostMicros`. */
  readonly totalCostMicros: number;
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly modelCalls: number;
  readonly agentCalls: number;
  /** Active production time in milliseconds; time spent waiting at the human gate is excluded. */
  readonly productionTimeMs: number;
  readonly testMode: TestMode;
  /** Number of planned tests; 0 until the testing phase starts. */
  readonly testCount: number;
  /** Tests currently passing (PASS). */
  readonly passed: number;
  /** Tests currently failing (FAIL); `passed + failed <= testCount`. */
  readonly failed: number;
  /** Re-runs of a failed test without changing the workflow. */
  readonly retryLoops: number;
  /** Model-driven repairs of the workflow followed by a re-test. */
  readonly repairLoops: number;
  readonly updatedAt: IsoTimestamp;
}
