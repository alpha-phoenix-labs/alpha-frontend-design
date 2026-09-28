import { describe, expect, it, vi } from 'vitest';
import type { FactoryJob, FactoryResult, HumanGateState, TestResult } from '@/types/factory/index.ts';
import {
  FACTORY_JOB_STORAGE_KEY,
  FACTORY_PENDING_REQUEST_STORAGE_KEY,
  FactoryMutationLatch,
  createFactoryClientRequestId,
  approvalInputFromSnapshot,
  approvalSnapshotFor,
  clarificationInput,
  publicTestReport,
  readStoredFactoryJobId,
  readStoredFactoryPendingRequestId,
  recoverStoredFactoryJob,
  refreshAfterUnconfirmedMutation,
  submitApprovalOnce,
  submitClarificationOnce,
  submitPromptOnce,
  writeStoredFactoryJobId,
  writeStoredFactoryPendingRequestId,
} from '@/hooks/useSpectreFactoryIntegration.ts';

const job = (version: number): FactoryJob => ({
  id: 'job-1',
  version,
  status: 'awaiting_human',
  createdAt: '2026-09-27T00:00:00.000Z',
  updatedAt: '2026-09-27T00:01:00.000Z',
});

const approvalGate: HumanGateState = {
  jobId: 'job-1',
  type: 'approval',
  status: 'awaiting_human',
  requestedAt: '2026-09-27T00:01:00.000Z',
};

describe('Spectre factory integration helpers', () => {
  it('pins the rendered approval version and signs exactly that version', () => {
    const rendered = approvalSnapshotFor(job(7), approvalGate);
    expect(rendered).toEqual({ jobId: 'job-1', version: 7 });

    const storeLaterHas = job(8);
    expect(storeLaterHas.version).toBe(8);
    expect(approvalInputFromSnapshot(rendered!, true)).toEqual({ jobId: 'job-1', version: 7, approve: true });
  });

  it('does not create an approval snapshot for a non-approval gate or mismatched job', () => {
    const clarification: HumanGateState = {
      jobId: 'job-1',
      type: 'clarification',
      status: 'awaiting_human',
      requestedAt: '2026-09-27T00:01:00.000Z',
      question: 'Which CRM?',
    };
    expect(approvalSnapshotFor(job(7), clarification)).toBeNull();
    expect(approvalSnapshotFor(job(7), { ...approvalGate, jobId: 'job-2' })).toBeNull();
  });

  it('builds clarification input only from a non-empty local draft', () => {
    expect(clarificationInput('job-1', '  HubSpot  ')).toEqual({ jobId: 'job-1', response: 'HubSpot' });
    expect(clarificationInput('job-1', '   ')).toBeNull();
  });

  it('submits a prompt once and preserves failures without retry', async () => {
    const latch = new FactoryMutationLatch();
    const success = vi.fn(() => Promise.resolve<FactoryResult<FactoryJob>>({ ok: true, value: job(1) }));
    const failed = vi.fn(() =>
      Promise.resolve<FactoryResult<FactoryJob>>({
        ok: false,
        error: { kind: 'http', httpStatus: 500, code: 'SERVER', message: 'boom' },
      }),
    );

    expect((await submitPromptOnce(latch, success, '  build a workflow  ', 'req-1'))?.ok).toBe(true);
    expect(success).toHaveBeenCalledWith({ description: 'build a workflow', testMode: 'mock', clientRequestId: 'req-1' });
    expect((await submitPromptOnce(latch, failed, 'build another', 'req-2'))?.ok).toBe(false);
    expect(failed).toHaveBeenCalledTimes(1);
  });

  it('blocks duplicate prompt submission before persisting a second correlation id', async () => {
    const latch = new FactoryMutationLatch();
    let release: ((value: FactoryResult<FactoryJob>) => void) | undefined;
    const submit = vi.fn(
      () =>
        new Promise<FactoryResult<FactoryJob>>((resolve) => {
          release = resolve;
        }),
    );
    const firstStarted = vi.fn();
    const secondStarted = vi.fn();

    const first = submitPromptOnce(latch, submit, 'build one', 'req-1', firstStarted);
    const second = await submitPromptOnce(latch, submit, 'build two', 'req-2', secondStarted);

    expect(second).toBeNull();
    expect(firstStarted).toHaveBeenCalledTimes(1);
    expect(secondStarted).not.toHaveBeenCalled();
    expect(submit).toHaveBeenCalledTimes(1);
    release?.({ ok: true, value: job(1) });
    expect((await first)?.ok).toBe(true);
  });

  it('blocks duplicate clarification submission while the first mutation is in flight', async () => {
    const latch = new FactoryMutationLatch();
    let release: ((value: FactoryResult<FactoryJob>) => void) | undefined;
    const submit = vi.fn(
      () =>
        new Promise<FactoryResult<FactoryJob>>((resolve) => {
          release = resolve;
        }),
    );

    const first = submitClarificationOnce(latch, submit, 'job-1', 'HubSpot');
    const second = await submitClarificationOnce(latch, submit, 'job-1', 'HubSpot');

    expect(second).toBeNull();
    expect(submit).toHaveBeenCalledTimes(1);
    release?.({ ok: true, value: job(2) });
    expect((await first)?.ok).toBe(true);
  });

  it('returns MUTATION_UNCONFIRMED from clarification without automatic retry', async () => {
    const latch = new FactoryMutationLatch();
    const submit = vi.fn(() =>
      Promise.resolve<FactoryResult<FactoryJob>>({
        ok: false,
        error: { kind: 'network', code: 'MUTATION_UNCONFIRMED', message: 'unknown' },
      }),
    );

    const result = await submitClarificationOnce(latch, submit, 'job-1', 'HubSpot');
    expect(result).toMatchObject({ ok: false, error: { code: 'MUTATION_UNCONFIRMED' } });
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('sends the rendered approval version once on VERSION_CONFLICT and never auto-reapproves', async () => {
    const latch = new FactoryMutationLatch();
    const submit = vi.fn(() =>
      Promise.resolve<FactoryResult<FactoryJob>>({
        ok: false,
        error: { kind: 'http', httpStatus: 409, code: 'VERSION_CONFLICT', message: 'conflict' },
      }),
    );

    const result = await submitApprovalOnce(latch, submit, { jobId: 'job-1', version: 5 }, true);
    expect(result).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith({ jobId: 'job-1', version: 5, approve: true });
  });

  it('reload recovery restores a known job id and performs one read refresh', async () => {
    const setActiveJob = vi.fn();
    const refresh = vi.fn(() => Promise.resolve());

    await recoverStoredFactoryJob('job-1', setActiveJob, refresh);

    expect(setActiveJob).toHaveBeenCalledWith('job-1');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith('job-1');
  });

  it('manual unknown-mutation recovery performs two sequential read refreshes and no mutation', async () => {
    const order: string[] = [];
    const refresh = vi.fn(async (jobId: string) => {
      order.push(jobId);
    });

    await refreshAfterUnconfirmedMutation(refresh, 'job-1');
    expect(order).toEqual(['job-1', 'job-1']);
  });

  it('creates and persists a stable pending client request id', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };

    expect(createFactoryClientRequestId(() => '1234-5678')).toBe('cf_1234-5678');
    writeStoredFactoryPendingRequestId(storage, 'cf_1234-5678');
    expect(values.get(FACTORY_PENDING_REQUEST_STORAGE_KEY)).toBe('cf_1234-5678');
    expect(readStoredFactoryPendingRequestId(storage)).toBe('cf_1234-5678');
    writeStoredFactoryPendingRequestId(storage, null);
    expect(readStoredFactoryPendingRequestId(storage)).toBeNull();
  });

  it('persists and restores only a known non-empty job id', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    };

    writeStoredFactoryJobId(storage, 'job-1');
    expect(values.get(FACTORY_JOB_STORAGE_KEY)).toBe('job-1');
    expect(readStoredFactoryJobId(storage)).toBe('job-1');

    writeStoredFactoryJobId(storage, null);
    expect(readStoredFactoryJobId(storage)).toBeNull();
  });

  it('exposes only TestReportV1 to the real-report UI and isolates legacy mock metrics', () => {
    const publicReport = {
      contractVersion: '1.0',
      jobId: 'job-1',
      result: 'PASS',
      executionId: 'exec-1',
    } as const;
    const legacy: TestResult = {
      jobId: 'job-1',
      testMode: 'mock',
      testCount: 1,
      passed: 1,
      failed: 0,
      retryLoops: 0,
      repairLoops: 0,
    };

    expect(publicTestReport(publicReport)).toEqual(publicReport);
    expect(publicTestReport(legacy)).toBeNull();
    expect(publicTestReport(null)).toBeNull();
  });
});
