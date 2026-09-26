import { afterEach, describe, expect, it, vi } from 'vitest';
import { MockFactoryService } from '@/services/factory/MockFactoryService.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('MockFactoryService', () => {
  it('works without fetch and runs through the approval gate with increasing versions', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    let now = 1_000_000;
    const mock = new MockFactoryService({ now: () => now, responseDelayMs: 0 });

    const created = await mock.submitWorkflowRequest({ description: 'Baue X', testMode: 'mock' });
    expect(created.ok && created.value.status).toBe('queued');
    const jobId = created.ok ? created.value.id : '';
    const firstVersion = created.ok ? created.value.version : 0;

    now += 60_000;
    const waiting = await mock.getJobStatus(jobId);
    expect(waiting.ok && waiting.value.status).toBe('awaiting_human');
    const version = waiting.ok ? waiting.value.version : 0;
    expect(version).toBeGreaterThan(firstVersion);
    expect(await mock.getHumanGateState(jobId)).toMatchObject({ ok: true, value: { type: 'approval', status: 'awaiting_human' } });

    const stale = await mock.submitApproval({ jobId, version: version - 1, approve: true });
    expect(stale).toMatchObject({ ok: false, error: { code: 'VERSION_CONFLICT' } });

    const approved = await mock.submitApproval({ jobId, version, approve: true });
    expect(approved.ok && approved.value.status).toBe('approved');
    expect(approved.ok && approved.value.version).toBeGreaterThan(version);
    expect(await mock.getHumanGateState(jobId)).toMatchObject({ ok: true, value: { type: 'approval', status: 'approved' } });

    expect(await mock.submitClarification({ jobId, response: 'x' })).toMatchObject({ ok: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejection moves the job to failed', async () => {
    let now = 0;
    const mock = new MockFactoryService({ now: () => now, responseDelayMs: 0 });
    const created = await mock.submitWorkflowRequest({ description: 'Baue X', testMode: 'mock' });
    const jobId = created.ok ? created.value.id : '';
    now += 60_000;
    const waiting = await mock.getJobStatus(jobId);
    const version = waiting.ok ? waiting.value.version : 0;
    const rejected = await mock.submitApproval({ jobId, version, approve: false });
    expect(rejected).toMatchObject({ ok: true, value: { status: 'failed', error: { code: 'APPROVAL_REJECTED' } } });
  });
});
