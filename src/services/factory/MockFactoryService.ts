import type {
  ApiError,
  FactoryJob,
  FactoryResult,
  HumanGateState,
  JobStatus,
  ProductionCost,
  TestResult,
  WorkflowExecutionResult,
  WorkflowGenerationResult,
  WorkflowRequest,
} from '@/types/factory/index.ts';
import type { FactoryService } from '@/services/factory/FactoryService.ts';
import {
  MOCK_COST_PROFILE,
  MOCK_POST_APPROVAL_STEPS,
  MOCK_RESPONSE_DELAY_MS,
  MOCK_SCENARIOS,
  type MockFactoryScenario,
  type MockScenarioDefinition,
  type MockStatusStep,
} from '@/mocks/factory.ts';

/** Options of the mock factory service. */
export interface MockFactoryServiceOptions {
  readonly scenario?: MockFactoryScenario;
  /** Millisecond clock; defaults to `Date.now`. */
  readonly now?: () => number;
  readonly responseDelayMs?: number;
}

interface MockJobRecord {
  readonly id: string;
  readonly sequence: number;
  readonly request: WorkflowRequest;
  readonly createdAtMs: number;
  readonly scenario: MockScenarioDefinition;
  approvedAtMs: number | null;
}

interface ResolvedStep {
  readonly status: JobStatus;
  readonly enteredAtMs: number;
  /** Start of the following step, or null if this step lasts until further action. */
  readonly endsAtMs: number | null;
}

const iso = (ms: number): string => new Date(ms).toISOString();
const roundCost = (value: number): number => Math.round(value * 10000) / 10000;

function jobNotFound(jobId: string): ApiError {
  return { kind: 'unknown', code: 'job_not_found', message: `Job ${jobId} ist unbekannt.` };
}

/** Simulates a factory backend: jobs progress through the JobStatus values on a fixed timeline. */
export class MockFactoryService implements FactoryService {
  readonly #jobs = new Map<string, MockJobRecord>();
  readonly #scenario: MockFactoryScenario;
  readonly #now: () => number;
  readonly #delayMs: number;
  #sequence = 0;

  constructor(options: MockFactoryServiceOptions = {}) {
    this.#scenario = options.scenario ?? 'happyPath';
    this.#now = options.now ?? Date.now;
    this.#delayMs = options.responseDelayMs ?? MOCK_RESPONSE_DELAY_MS;
  }

  readonly submitWorkflowRequest = (request: WorkflowRequest): Promise<FactoryResult<FactoryJob>> =>
    this.#respond(() => {
      if (request.description.trim() === '') {
        return {
          ok: false,
          error: { kind: 'invalidResponse', code: 'empty_description', message: 'Die Beschreibung ist leer.' },
        };
      }
      this.#sequence += 1;
      const record: MockJobRecord = {
        id: `mock-job-${this.#sequence.toString().padStart(4, '0')}`,
        sequence: this.#sequence,
        request,
        createdAtMs: this.#now(),
        scenario: MOCK_SCENARIOS[this.#scenario],
        approvedAtMs: null,
      };
      this.#jobs.set(record.id, record);
      return { ok: true, value: this.#toJob(record) };
    });

  readonly getJobStatus = (jobId: string): Promise<FactoryResult<FactoryJob>> =>
    this.#withJob(jobId, (record) => this.#toJob(record));

  readonly getGeneratedWorkflow = (jobId: string): Promise<FactoryResult<WorkflowGenerationResult | null>> =>
    this.#withJob(jobId, (record) => {
      const generated = this.#stepOf(record, 'generated');
      if (generated === null) {
        return null;
      }
      return {
        jobId: record.id,
        workflowId: `mock-workflow-${record.sequence.toString().padStart(4, '0')}`,
        generatedAt: iso(generated.enteredAtMs),
      };
    });

  readonly getTestStatus = (jobId: string): Promise<FactoryResult<TestResult | null>> =>
    this.#withJob(jobId, (record) => {
      const testing = this.#stepOf(record, 'testing');
      if (testing === null) {
        return null;
      }
      const profile = record.scenario.tests;
      const progress = this.#progress(testing);
      const base = {
        jobId: record.id,
        testMode: record.request.testMode,
        testCount: profile.testCount,
        passed: Math.round(profile.passed * progress),
        failed: Math.round(profile.failed * progress),
        repairLoops: Math.round(profile.repairLoops * progress),
      };
      return testing.endsAtMs !== null && progress >= 1 ? { ...base, completedAt: iso(testing.endsAtMs) } : base;
    });

  readonly getExecutionStatus = (jobId: string): Promise<FactoryResult<WorkflowExecutionResult | null>> =>
    this.#withJob(jobId, (record) => {
      const approved = this.#stepOf(record, 'approved');
      if (approved === null) {
        return null;
      }
      const base = {
        jobId: record.id,
        executionId: `mock-execution-${record.sequence.toString().padStart(4, '0')}`,
        startedAt: iso(approved.enteredAtMs),
      };
      const completed = this.#stepOf(record, 'completed');
      return completed === null
        ? { ...base, status: approved.status }
        : { ...base, status: completed.status, finishedAt: iso(completed.enteredAtMs) };
    });

  readonly getHumanGateState = (jobId: string): Promise<FactoryResult<HumanGateState | null>> =>
    this.#withJob(jobId, (record) => this.#gateOf(record));

  readonly submitApproval = (jobId: string): Promise<FactoryResult<HumanGateState>> =>
    this.#respond(() => {
      const record = this.#jobs.get(jobId);
      if (record === undefined) {
        return { ok: false, error: jobNotFound(jobId) };
      }
      if (record.approvedAtMs === null) {
        if (this.#currentStep(record).status !== 'awaiting_human') {
          return {
            ok: false,
            error: {
              kind: 'unknown',
              code: 'gate_not_open',
              message: `Job ${jobId} wartet derzeit nicht auf eine Freigabe.`,
            },
          };
        }
        record.approvedAtMs = this.#now();
      }
      const gate = this.#gateOf(record);
      return gate === null
        ? { ok: false, error: { kind: 'unknown', code: 'gate_not_open', message: `Job ${jobId} hat kein Human Gate.` } }
        : { ok: true, value: gate };
    });

  readonly getProductionCost = (jobId: string): Promise<FactoryResult<ProductionCost | null>> =>
    this.#withJob(jobId, (record) => {
      const generating = this.#stepOf(record, 'generating');
      if (generating === null) {
        return null;
      }
      const { generation, perRepairLoop, platformCost } = MOCK_COST_PROFILE;
      const generationShare = this.#progress(generating);
      const testing = this.#stepOf(record, 'testing');
      const testProfile = record.scenario.tests;
      const testShare = testing === null ? 0 : this.#progress(testing);
      const loops = testProfile.repairLoops * testShare;
      const current = this.#currentStep(record);
      const endMs = current.endsAtMs === null ? current.enteredAtMs : this.#now();
      const apiCost = roundCost(generation.apiCost * generationShare + perRepairLoop.apiCost * loops);
      return {
        jobId: record.id,
        apiCost,
        tokensIn: Math.round(generation.tokensIn * generationShare + perRepairLoop.tokensIn * loops),
        tokensOut: Math.round(generation.tokensOut * generationShare + perRepairLoop.tokensOut * loops),
        modelCalls: Math.round(generation.modelCalls * generationShare + perRepairLoop.modelCalls * loops),
        durationMs: Math.max(0, endMs - record.createdAtMs),
        testMode: record.request.testMode,
        testCount: testProfile.testCount,
        passed: Math.round(testProfile.passed * testShare),
        failed: Math.round(testProfile.failed * testShare),
        repairLoops: Math.round(loops),
        totalCost: roundCost(apiCost + platformCost),
      };
    });

  #respond<T>(produce: () => FactoryResult<T>): Promise<FactoryResult<T>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          resolve(produce());
        } catch (cause) {
          resolve({
            ok: false,
            error: {
              kind: 'unknown',
              code: 'mock_failure',
              message: cause instanceof Error ? cause.message : 'Unbekannter Fehler im Mock-Service.',
            },
          });
        }
      }, this.#delayMs);
    });
  }

  #withJob<T>(jobId: string, read: (record: MockJobRecord) => T): Promise<FactoryResult<T>> {
    return this.#respond(() => {
      const record = this.#jobs.get(jobId);
      return record === undefined ? { ok: false, error: jobNotFound(jobId) } : { ok: true, value: read(record) };
    });
  }

  /** All steps the job has entered so far, in order, with absolute times. */
  #reachedSteps(record: MockJobRecord): readonly ResolvedStep[] {
    const absolute: MockStatusStep[] = record.scenario.steps.map((step) => ({
      status: step.status,
      atMs: record.createdAtMs + step.atMs,
    }));
    if (record.approvedAtMs !== null) {
      const approvedAt = record.approvedAtMs;
      absolute.push(...MOCK_POST_APPROVAL_STEPS.map((step) => ({ status: step.status, atMs: approvedAt + step.atMs })));
    }
    const now = this.#now();
    const resolved: ResolvedStep[] = [];
    absolute.forEach((step, index) => {
      if (step.atMs <= now || index === 0) {
        resolved.push({ status: step.status, enteredAtMs: step.atMs, endsAtMs: absolute[index + 1]?.atMs ?? null });
      }
    });
    return resolved;
  }

  #currentStep(record: MockJobRecord): ResolvedStep {
    const steps = this.#reachedSteps(record);
    const last = steps[steps.length - 1];
    return last ?? { status: 'queued', enteredAtMs: record.createdAtMs, endsAtMs: null };
  }

  #stepOf(record: MockJobRecord, status: JobStatus): ResolvedStep | null {
    return this.#reachedSteps(record).find((step) => step.status === status) ?? null;
  }

  /** Fraction (0..1) of a step that has elapsed; steps without a successor count as complete. */
  #progress(step: ResolvedStep): number {
    if (step.endsAtMs === null) {
      return 1;
    }
    const span = step.endsAtMs - step.enteredAtMs;
    return span <= 0 ? 1 : Math.min(1, Math.max(0, (this.#now() - step.enteredAtMs) / span));
  }

  #gateOf(record: MockJobRecord): HumanGateState | null {
    const awaiting = this.#stepOf(record, 'awaiting_human');
    if (awaiting === null) {
      return null;
    }
    if (record.approvedAtMs === null) {
      return { jobId: record.id, status: 'awaiting_human', requestedAt: iso(awaiting.enteredAtMs) };
    }
    return {
      jobId: record.id,
      status: 'approved',
      requestedAt: iso(awaiting.enteredAtMs),
      approvedAt: iso(record.approvedAtMs),
    };
  }

  #toJob(record: MockJobRecord): FactoryJob {
    const steps = this.#reachedSteps(record);
    const current = steps[steps.length - 1] ?? { status: 'queued' as const, enteredAtMs: record.createdAtMs, endsAtMs: null };
    const isFinalStep = current.endsAtMs === null && record.scenario.steps[record.scenario.steps.length - 1]?.status === current.status;
    const job: FactoryJob = {
      id: record.id,
      status: current.status,
      request: record.request,
      createdAt: iso(record.createdAtMs),
      updatedAt: iso(current.enteredAtMs),
    };
    return isFinalStep && record.scenario.finalError !== undefined ? { ...job, error: record.scenario.finalError } : job;
  }
}
