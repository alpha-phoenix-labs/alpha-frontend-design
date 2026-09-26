import { describe, expect, it, vi } from 'vitest';
import type {
  FactoryJob,
  FactoryResult,
  HumanGateState,
  TestReportV1,
  TestResult,
  WorkflowProductionMetrics,
} from '@/types/factory/index.ts';
import { HttpFactoryService, UnavailableFactoryService, type FactoryService } from '@/services/factory/index.ts';
import { createFactoryStore } from '@/store/factory/factoryStore.ts';

const job = (version: number, status: FactoryJob['status'] = 'testing'): FactoryJob => ({
  id: 'job-1',
  version,
  status,
  createdAt: '2026-09-26T10:00:00.000Z',
  updatedAt: '2026-09-26T10:05:00.000Z',
});

const backend = (version: number, status = 'TESTING') => ({
  jobId: 'job-1',
  version,
  status,
  createdAt: '2026-09-26T10:00:00.000Z',
  updatedAt: '2026-09-26T10:05:00.000Z',
  testReport: null,
  errorMessage: null,
  clarificationQuestion: null,
});

function serviceWith(overrides: Partial<FactoryService>): FactoryService {
  return Object.assign(new UnavailableFactoryService(), overrides);
}

describe('factoryStore', () => {
  it('one refreshJob against the HTTP service performs exactly one GET', async () => {
    const fetchFn = vi.fn(() => Promise.resolve(new Response(JSON.stringify(backend(3)), { status: 200 })));
    const store = createFactoryStore(
      new HttpFactoryService({ baseUrl: 'https://factory.example.test', fetch: fetchFn as unknown as typeof fetch }),
    );
    await store.getState().refreshJob('job-1');
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(store.getState().jobs['job-1']?.version).toBe(3);
    expect(store.getState().lastError).toBeNull();
  });

  it('storeJob ignores jobs with a lower version than the stored one', async () => {
    const responses = [job(5, 'approved'), job(4, 'awaiting_human')];
    const store = createFactoryStore(
      serviceWith({
        getJobStatus: () => {
          const next = responses.shift();
          return Promise.resolve<FactoryResult<FactoryJob>>(
            next === undefined ? { ok: false, error: { kind: 'unknown', code: 'X', message: 'x' } } : { ok: true, value: next },
          );
        },
        getGeneratedWorkflow: () => Promise.resolve({ ok: true, value: null }),
        getTestStatus: () => Promise.resolve({ ok: true, value: null }),
        getExecutionStatus: () => Promise.resolve({ ok: true, value: null }),
        getHumanGateState: () => Promise.resolve({ ok: true, value: null }),
        getProductionMetrics: () => Promise.resolve({ ok: true, value: null }),
      }),
    );
    await store.getState().refreshJob('job-1');
    await store.getState().refreshJob('job-1');
    expect(store.getState().jobs['job-1']).toMatchObject({ version: 5, status: 'approved' });
  });

  it('ignores stale snapshot and all associated state', async () => {
    let round = 0;
    const currentTest: TestResult = {
      jobId: 'job-1',
      testMode: 'mock',
      testCount: 10,
      passed: 10,
      failed: 0,
      retryLoops: 0,
      repairLoops: 0,
    };
    const staleTest: TestResult = { ...currentTest, testCount: 9, passed: 9 };
    const currentMetrics: WorkflowProductionMetrics = {
      jobId: 'job-1',
      currency: 'USD',
      apiCostMicros: 1000,
      platformCostMicros: 0,
      totalCostMicros: 1000,
      tokensIn: 10,
      tokensOut: 10,
      modelCalls: 1,
      agentCalls: 1,
      productionTimeMs: 1000,
      testMode: 'mock',
      testCount: 10,
      passed: 10,
      failed: 0,
      retryLoops: 0,
      repairLoops: 0,
      updatedAt: '2026-09-26T10:10:00.000Z',
    };
    const staleMetrics: WorkflowProductionMetrics = {
      ...currentMetrics,
      apiCostMicros: 900,
      totalCostMicros: 900,
      productionTimeMs: 900,
      testCount: 9,
      passed: 9,
      updatedAt: '2026-09-26T10:09:00.000Z',
    };
    const staleGate: HumanGateState = {
      jobId: 'job-1',
      type: 'clarification',
      status: 'awaiting_human',
      requestedAt: '2026-09-26T10:09:00.000Z',
      question: 'Veraltete Frage?',
    };
    const store = createFactoryStore(
      serviceWith({
        getJobStatus: () => {
          round += 1;
          return Promise.resolve({ ok: true, value: round === 1 ? job(10, 'approved') : job(9, 'awaiting_human') });
        },
        getGeneratedWorkflow: () => Promise.resolve({ ok: true, value: null }),
        getTestStatus: () => Promise.resolve({ ok: true, value: round === 1 ? currentTest : staleTest }),
        getExecutionStatus: () => Promise.resolve({ ok: true, value: null }),
        getHumanGateState: () => Promise.resolve({ ok: true, value: round === 1 ? null : staleGate }),
        getProductionMetrics: () => Promise.resolve({ ok: true, value: round === 1 ? currentMetrics : staleMetrics }),
      }),
    );

    await store.getState().refreshJob('job-1');
    await store.getState().refreshJob('job-1');

    expect(store.getState().jobs['job-1']).toMatchObject({ version: 10, status: 'approved' });
    expect(store.getState().testResults['job-1']).toEqual(currentTest);
    expect(store.getState().productionMetrics['job-1']).toEqual(currentMetrics);
    expect('job-1' in store.getState().humanGates).toBe(false);
  });

  it('stores public TestReportV1 verbatim, removes it on null, and never derives metrics from it', async () => {
    let round = 0;
    const report: TestReportV1 = {
      contractVersion: '1.0',
      jobId: 'job-1',
      result: 'NOT_PASS',
      reason: 'EXECUTION_FAILED',
      importedId: 'wf-1',
      executionId: 'exec-1',
      evidence: 'trace-1',
    };
    const store = createFactoryStore(
      serviceWith({
        getJobStatus: () => Promise.resolve({ ok: true, value: job(4, 'testing') }),
        getGeneratedWorkflow: () => Promise.resolve({ ok: true, value: null }),
        getTestStatus: () => Promise.resolve({ ok: true, value: round++ === 0 ? report : null }),
        getExecutionStatus: () => Promise.resolve({ ok: true, value: null }),
        getHumanGateState: () => Promise.resolve({ ok: true, value: null }),
        getProductionMetrics: () => Promise.resolve({ ok: true, value: null }),
      }),
    );

    await store.getState().refreshJob('job-1');
    expect(store.getState().testResults['job-1']).toEqual(report);
    expect(store.getState().jobs['job-1']?.status).toBe('testing');
    expect('job-1' in store.getState().productionMetrics).toBe(false);

    await store.getState().refreshJob('job-1');
    expect('job-1' in store.getState().testResults).toBe(false);
    expect('job-1' in store.getState().productionMetrics).toBe(false);
  });

  it('submitApproval stores the returned job', async () => {
    const store = createFactoryStore(serviceWith({ submitApproval: () => Promise.resolve({ ok: true, value: job(6, 'approved') }) }));
    const result = await store.getState().submitApproval({ jobId: 'job-1', version: 5, approve: true });
    expect(result.ok).toBe(true);
    expect(store.getState().jobs['job-1']?.version).toBe(6);
  });

  it('VERSION_CONFLICT on approval triggers one refresh', async () => {
    const getJobStatus = vi.fn(() => Promise.resolve<FactoryResult<FactoryJob>>({ ok: true, value: job(7, 'awaiting_human') }));
    const store = createFactoryStore(
      serviceWith({
        submitApproval: () =>
          Promise.resolve({ ok: false, error: { kind: 'http', httpStatus: 409, code: 'VERSION_CONFLICT', message: 'conflict' } }),
        getJobStatus,
      }),
    );
    const result = await store.getState().submitApproval({ jobId: 'job-1', version: 5, approve: true });
    expect(result.ok).toBe(false);
    expect(getJobStatus).toHaveBeenCalledTimes(1);
    expect(store.getState().jobs['job-1']?.version).toBe(7);
  });

  it('submitClarification stores the returned job', async () => {
    const submitClarification = vi.fn(() => Promise.resolve<FactoryResult<FactoryJob>>({ ok: true, value: job(2, 'generating') }));
    const store = createFactoryStore(serviceWith({ submitClarification }));
    await store.getState().submitClarification({ jobId: 'job-1', response: 'HubSpot' });
    expect(submitClarification).toHaveBeenCalledWith({ jobId: 'job-1', response: 'HubSpot' });
    expect(store.getState().jobs['job-1']?.status).toBe('generating');
  });

  it('refreshJob removes the gate on a successful null and keeps it on error', async () => {
    const gates: FactoryResult<HumanGateState | null>[] = [
      { ok: true, value: { jobId: 'job-1', type: 'approval', status: 'awaiting_human', requestedAt: '2026-09-26T10:05:00.000Z' } },
      { ok: false, error: { kind: 'network', code: 'NETWORK', message: 'offline' } },
      { ok: true, value: null },
    ];
    const store = createFactoryStore(
      serviceWith({
        getJobStatus: () => Promise.resolve({ ok: true, value: job(3, 'awaiting_human') }),
        getGeneratedWorkflow: () => Promise.resolve({ ok: true, value: null }),
        getTestStatus: () => Promise.resolve({ ok: true, value: null }),
        getExecutionStatus: () => Promise.resolve({ ok: true, value: null }),
        getHumanGateState: () =>
          Promise.resolve(gates.shift() ?? { ok: false, error: { kind: 'unknown', code: 'X', message: 'x' } }),
        getProductionMetrics: () => Promise.resolve({ ok: true, value: null }),
      }),
    );
    await store.getState().refreshJob('job-1');
    expect(store.getState().humanGates['job-1']).toMatchObject({ type: 'approval', status: 'awaiting_human' });
    await store.getState().refreshJob('job-1');
    expect(store.getState().humanGates['job-1']).toMatchObject({ type: 'approval', status: 'awaiting_human' });
    await store.getState().refreshJob('job-1');
    expect('job-1' in store.getState().humanGates).toBe(false);
  });
});
