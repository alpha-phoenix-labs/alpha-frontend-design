import type { ApiError, JobStatus } from '@/types/factory/index.ts';

/** Simulated factory runs offered by the mock service. */
export type MockFactoryScenario = 'happyPath' | 'testFailure' | 'blocked';

/** A status the simulated job enters `atMs` milliseconds after its start reference. */
export interface MockStatusStep {
  readonly status: JobStatus;
  readonly atMs: number;
}

/**
 * One event of a simulated test run, in order:
 * - `pass` / `fail`: a planned test runs for the first time with that outcome.
 * - `retry`: a failing test is re-run unchanged; `recovered` turns it into a pass.
 * - `repair`: the workflow is repaired by the model and the failing test re-run; `recovered` turns it into a pass.
 */
export type MockTestEvent =
  | { readonly kind: 'pass' }
  | { readonly kind: 'fail' }
  | { readonly kind: 'retry'; readonly recovered: boolean }
  | { readonly kind: 'repair'; readonly recovered: boolean };

/** Complete description of one simulated run. */
export interface MockScenarioDefinition {
  /** Steps from submission up to the human gate or a final state. */
  readonly steps: readonly MockStatusStep[];
  /** Test events, spread evenly over the `testing` step. */
  readonly testEvents: readonly MockTestEvent[];
  /** Error attached to the job once its last step is reached. */
  readonly finalError?: ApiError;
}

/** Steps after approval, relative to the approval time. */
export const MOCK_POST_APPROVAL_STEPS: readonly MockStatusStep[] = [
  { status: 'approved', atMs: 0 },
  { status: 'completed', atMs: 2500 },
];

const PIPELINE_TO_TESTING: readonly MockStatusStep[] = [
  { status: 'queued', atMs: 0 },
  { status: 'generating', atMs: 1500 },
  { status: 'generated', atMs: 5500 },
  { status: 'importing', atMs: 7000 },
  { status: 'testing', atMs: 8500 },
];

export const MOCK_SCENARIOS: Readonly<Record<MockFactoryScenario, MockScenarioDefinition>> = {
  happyPath: {
    steps: [...PIPELINE_TO_TESTING, { status: 'awaiting_human', atMs: 13500 }],
    testEvents: [
      { kind: 'pass' },
      { kind: 'pass' },
      { kind: 'fail' },
      { kind: 'retry', recovered: false },
      { kind: 'repair', recovered: true },
      { kind: 'pass' },
      { kind: 'pass' },
      { kind: 'pass' },
    ],
  },
  testFailure: {
    steps: [...PIPELINE_TO_TESTING, { status: 'failed', atMs: 15000 }],
    testEvents: [
      { kind: 'pass' },
      { kind: 'fail' },
      { kind: 'pass' },
      { kind: 'fail' },
      { kind: 'pass' },
      { kind: 'fail' },
      { kind: 'retry', recovered: false },
      { kind: 'repair', recovered: true },
      { kind: 'repair', recovered: false },
      { kind: 'repair', recovered: false },
    ],
    finalError: {
      kind: 'unknown',
      code: 'tests_failed',
      message: '2 von 6 Tests nach 3 Reparaturschleifen weiterhin fehlgeschlagen.',
    },
  },
  blocked: {
    steps: [
      { status: 'queued', atMs: 0 },
      { status: 'generating', atMs: 1500 },
      { status: 'generated', atMs: 5500 },
      { status: 'importing', atMs: 7000 },
      { status: 'blocked', atMs: 9000 },
    ],
    testEvents: [],
    finalError: {
      kind: 'unknown',
      code: 'import_blocked',
      message: 'Import angehalten: benötigte Zugangsdaten sind in der Factory nicht hinterlegt.',
    },
  },
};

/** Model and agent usage; `apiCostMicros` in micros of USD (1 USD = 1_000_000). */
export interface MockUsage {
  readonly tokensIn: number;
  readonly tokensOut: number;
  readonly modelCalls: number;
  readonly agentCalls: number;
  readonly apiCostMicros: number;
}

/** Usage accrued over a status step, proportional to the step's elapsed share. */
export const MOCK_PHASE_USAGE: Readonly<Partial<Record<JobStatus, MockUsage>>> = {
  generating: { tokensIn: 4200, tokensOut: 2600, modelCalls: 3, agentCalls: 2, apiCostMicros: 42_000 },
  importing: { tokensIn: 600, tokensOut: 150, modelCalls: 1, agentCalls: 1, apiCostMicros: 4_000 },
  testing: { tokensIn: 900, tokensOut: 300, modelCalls: 1, agentCalls: 1, apiCostMicros: 6_000 },
  approved: { tokensIn: 0, tokensOut: 0, modelCalls: 0, agentCalls: 1, apiCostMicros: 0 },
};

/** Usage of a single retry or repair loop. */
export const MOCK_LOOP_USAGE: Readonly<Record<'retry' | 'repair', MockUsage>> = {
  retry: { tokensIn: 0, tokensOut: 0, modelCalls: 0, agentCalls: 1, apiCostMicros: 0 },
  repair: { tokensIn: 1800, tokensOut: 900, modelCalls: 1, agentCalls: 1, apiCostMicros: 18_000 },
};

/** Platform cost per second of active production time, in micros of USD. */
export const MOCK_PLATFORM_COST_MICROS_PER_SECOND = 500;

/** Simulated network latency of a mock call in milliseconds. */
export const MOCK_RESPONSE_DELAY_MS = 180;
