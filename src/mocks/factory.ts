import type { ApiError, JobStatus } from '@/types/factory/index.ts';

/** Simulated factory runs offered by the mock service. */
export type MockFactoryScenario = 'happyPath' | 'testFailure' | 'blocked';

/** A status the simulated job enters `atMs` milliseconds after its start reference. */
export interface MockStatusStep {
  readonly status: JobStatus;
  readonly atMs: number;
}

/** Final test figures of a scenario. */
export interface MockTestProfile {
  readonly testCount: number;
  readonly passed: number;
  readonly failed: number;
  readonly repairLoops: number;
}

/** Complete description of one simulated run. */
export interface MockScenarioDefinition {
  /** Steps from submission up to the human gate or a final state. */
  readonly steps: readonly MockStatusStep[];
  readonly tests: MockTestProfile;
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
    tests: { testCount: 6, passed: 6, failed: 0, repairLoops: 1 },
  },
  testFailure: {
    steps: [...PIPELINE_TO_TESTING, { status: 'failed', atMs: 15000 }],
    tests: { testCount: 6, passed: 4, failed: 2, repairLoops: 3 },
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
    tests: { testCount: 0, passed: 0, failed: 0, repairLoops: 0 },
    finalError: {
      kind: 'unknown',
      code: 'import_blocked',
      message: 'Import angehalten: benötigte Zugangsdaten sind in der Factory nicht hinterlegt.',
    },
  },
};

/** Token, call and cost figures used to simulate production cost. Monetary values are unitless mock numbers. */
export const MOCK_COST_PROFILE = {
  generation: { tokensIn: 4200, tokensOut: 2600, modelCalls: 3, apiCost: 0.042 },
  perRepairLoop: { tokensIn: 1800, tokensOut: 900, modelCalls: 1, apiCost: 0.018 },
  platformCost: 0.01,
} as const;

/** Simulated network latency of a mock call in milliseconds. */
export const MOCK_RESPONSE_DELAY_MS = 180;
