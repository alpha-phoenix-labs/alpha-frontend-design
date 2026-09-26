import type {
  ApiError,
  FactoryJob,
  FactoryResult,
  HumanGateState,
  JobStatus,
  TestResult,
  WorkflowExecutionResult,
  WorkflowGenerationResult,
  WorkflowProductionMetrics,
  WorkflowRequest,
} from '@/types/factory/index.ts';
import type { FactoryService } from '@/services/factory/FactoryService.ts';
import { totalProductionCostMicros } from '@/services/factory/productionMetrics.ts';
import {
  MOCK_LOOP_USAGE,
  MOCK_PHASE_USAGE,
  MOCK_PLATFORM_COST_MICROS_PER_SECOND,
  MOCK_POST_APPROVAL_STEPS,
  MOCK_RESPONSE_DELAY_MS,
  MOCK_SCENARIOS,
  type MockFactoryScenario,
  type MockScenarioDefinition,
  type MockStatusStep,
  type MockTestEvent,
  type MockUsage,
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

/** Test counters after a number of simulated test events. */
interface TestFigures {
  readonly testCount: number;
  readonly passed: number;
  readonly failed: number;
  readonly retryLoops: number;
  readonly repairLoops: number;
}

const NO_TESTS: TestFigures = { testCount: 0, passed: 0, failed: 0, retryLoops: 0, repairLoops: 0 };
const NO_USAGE: MockUsage = { tokensIn: 0, tokensOut: 0, modelCalls: 0, agentCalls: 0, apiCostMicros: 0 };

const iso = (ms: number): string => new Date(ms).toISOString();
const padSequence = (sequence: number): string => sequence.toString().padStart(4, '0');

const addUsage = (total: MockUsage, usage: MockUsage, factor: number): MockUsage => ({
  tokensIn: total.tokensIn + usage.tokensIn * factor,
  tokensOut: total.tokensOut + usage.tokensOut * factor,
  modelCalls: total.modelCalls + usage.modelCalls * factor,
  agentCalls: total.agentCalls + usage.agentCalls * factor,
  apiCostMicros: total.apiCostMicros + usage.apiCostMicros * factor,
});

/** Applies test events in order; a recovered retry or repair turns one failing test into a passing one. */
function applyTestEvent(figures: TestFigures, event: MockTestEvent): TestFigures {
  switch (event.kind) {
    case 'pass':
      return { ...figures, passed: figures.passed + 1 };
    case 'fail':
      return { ...figures, failed: figures.failed + 1 };
    case 'retry':
    case 'repair': {
      const loops =
        event.kind === 'retry'
          ? { retryLoops: figures.retryLoops + 1, repairLoops: figures.repairLoops }
          : { retryLoops: figures.retryLoops, repairLoops: figures.repairLoops + 1 };
      const recovers = event.recovered && figures.failed > 0;
      return {
        ...figures,
        ...loops,
        passed: recovers ? figures.passed + 1 : figures.passed,
        failed: recovers ? figures.failed - 1 : figures.failed,
      };
    }
  }
}

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
        id: `mock-job-${padSequence(this.#sequence)}`,
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
        workflowId: this.#workflowIdOf(record),
        generatedAt: iso(generated.enteredAtMs),
      };
    });

  readonly getTestStatus = (jobId: string): Promise<FactoryResult<TestResult | null>> =>
    this.#withJob(jobId, (record) => {
      const testing = this.#stepOf(record, 'testing');
      if (testing === null) {
        return null;
      }
      const base = { jobId: record.id, testMode: record.request.testMode, ...this.#testFiguresOf(record) };
      return testing.endsAtMs !== null && this.#progress(testing) >= 1 ? { ...base, completedAt: iso(testing.endsAtMs) } : base;
    });

  readonly getExecutionStatus = (jobId: string): Promise<FactoryResult<WorkflowExecutionResult | null>> =>
    this.#withJob(jobId, (record) => {
      const approved = this.#stepOf(record, 'approved');
      if (approved === null) {
        return null;
      }
      const base = {
        jobId: record.id,
        executionId: `mock-execution-${padSequence(record.sequence)}`,
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

  readonly getProductionMetrics = (jobId: string): Promise<FactoryResult<WorkflowProductionMetrics | null>> =>
    this.#withJob(jobId, (record) => {
      const steps = this.#reachedSteps(record);
      const tests = this.#testFiguresOf(record);
      const phaseUsage = steps.reduce((total, step) => {
        const usage = MOCK_PHASE_USAGE[step.status];
        return usage === undefined ? total : addUsage(total, usage, this.#progress(step));
      }, NO_USAGE);
      const usage = addUsage(
        addUsage(phaseUsage, MOCK_LOOP_USAGE.retry, tests.retryLoops),
        MOCK_LOOP_USAGE.repair,
        tests.repairLoops,
      );
      const productionTimeMs = this.#productionTimeMs(steps);
      const costParts = {
        apiCostMicros: Math.round(usage.apiCostMicros),
        platformCostMicros: Math.round((productionTimeMs / 1000) * MOCK_PLATFORM_COST_MICROS_PER_SECOND),
      };
      const current = this.#currentStep(record);
      const updatedAtMs = current.endsAtMs === null ? current.enteredAtMs : this.#now();
      const metrics: WorkflowProductionMetrics = {
        jobId: record.id,
        currency: 'USD',
        ...costParts,
        totalCostMicros: totalProductionCostMicros(costParts),
        tokensIn: Math.round(usage.tokensIn),
        tokensOut: Math.round(usage.tokensOut),
        modelCalls: Math.round(usage.modelCalls),
        agentCalls: Math.round(usage.agentCalls),
        productionTimeMs,
        testMode: record.request.testMode,
        ...tests,
        updatedAt: iso(updatedAtMs),
      };
      return this.#stepOf(record, 'generated') === null ? metrics : { ...metrics, workflowId: this.#workflowIdOf(record) };
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

  #workflowIdOf(record: MockJobRecord): string {
    return `mock-workflow-${padSequence(record.sequence)}`;
  }

  /** Test counters so far; events are spread evenly over the `testing` step, the planned count is known at its start. */
  #testFiguresOf(record: MockJobRecord): TestFigures {
    const testing = this.#stepOf(record, 'testing');
    if (testing === null) {
      return NO_TESTS;
    }
    const events = record.scenario.testEvents;
    const applied = Math.floor(events.length * this.#progress(testing));
    const testCount = events.filter((event) => event.kind === 'pass' || event.kind === 'fail').length;
    return events.slice(0, applied).reduce(applyTestEvent, { ...NO_TESTS, testCount });
  }

  /** Elapsed time of all reached steps, excluding the wait at the human gate and steps that last until further action. */
  #productionTimeMs(steps: readonly ResolvedStep[]): number {
    const now = this.#now();
    return steps.reduce((total, step) => {
      if (step.status === 'awaiting_human' || step.endsAtMs === null) {
        return total;
      }
      return total + Math.max(0, Math.min(step.endsAtMs, now) - step.enteredAtMs);
    }, 0);
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
