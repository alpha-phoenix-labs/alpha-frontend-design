import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpFactoryService } from '@/services/factory/HttpFactoryService.ts';

const BASE = 'https://factory.example.test';
const CREATED_AT = '2026-09-26T10:00:00.000Z';
const UPDATED_AT = '2026-09-26T10:05:00.000Z';

interface Call {
  readonly url: string;
  readonly method: string;
  readonly body: unknown;
  readonly credentials: RequestCredentials | undefined;
}

function backendJob(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    jobId: 'job-1',
    version: 3,
    status: 'TESTING',
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    testReport: null,
    errorMessage: null,
    clarificationQuestion: null,
    ...overrides,
  };
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const text = (body: string, status: number): Response => new Response(body, { status });

/** Fake fetch answering from a queue of responders; records every call. */
function fakeFetch(...responders: ((call: Call) => Response | Promise<Response>)[]) {
  const calls: Call[] = [];
  const fn = vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const call: Call = {
      url: String(input),
      method: init?.method ?? 'GET',
      body: typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined,
      credentials: init?.credentials,
    };
    calls.push(call);
    const responder = responders.shift();
    if (responder === undefined) {
      return Promise.reject(new Error('unexpected fetch'));
    }
    return Promise.resolve(responder(call));
  });
  return { fetch: fn as unknown as typeof fetch, calls };
}

const service = (fetchFn: typeof fetch, extra: { getTimeoutMs?: number; postTimeoutMs?: number } = {}) =>
  new HttpFactoryService({ baseUrl: BASE, fetch: fetchFn, ...extra });

afterEach(() => {
  vi.useRealTimers();
});

describe('HttpFactoryService', () => {
  it('create: POSTs the prompt, then GETs timestamps and keeps the request', async () => {
    const prefix = `${BASE}/api/orchestrator`;
    // The POST answer carries no timestamps.
    const postBody = { jobId: 'job-1', version: 1, status: 'CREATED', testReport: null, errorMessage: null, clarificationQuestion: null };
    const { fetch, calls } = fakeFetch(
      () => json(postBody),
      () => json(backendJob({ status: 'PLANNED', version: 2 })),
    );
    const result = await service(fetch).submitWorkflowRequest({ description: 'Baue X', testMode: 'mock' });
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({ url: prefix, method: 'POST', body: { prompt: 'Baue X' }, credentials: 'same-origin' });
    expect(calls[1]).toMatchObject({ url: `${prefix}?jobId=job-1`, method: 'GET' });
    expect(result).toEqual({
      ok: true,
      value: {
        id: 'job-1',
        version: 2,
        status: 'generating',
        request: { description: 'Baue X', testMode: 'mock' },
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
      },
    });
  });

  it('GET maps version, status, error and test report without inventing values', async () => {
    const report = { testMode: 'dry_run', testCount: 4, passed: 3, failed: 1, retryLoops: 0, repairLoops: 1 };
    const { fetch } = fakeFetch(() => json(backendJob({ version: 7, status: 'FAILED', errorMessage: 'kaputt', testReport: report })));
    const http = service(fetch);
    const [job, test] = await Promise.all([http.getJobStatus('job-1'), http.getTestStatus('job-1')]);
    expect(job).toEqual({
      ok: true,
      value: {
        id: 'job-1',
        version: 7,
        status: 'failed',
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
        error: { kind: 'unknown', code: 'FACTORY_JOB_ERROR', message: 'kaputt' },
      },
    });
    expect(job.ok && 'request' in job.value).toBe(false);
    expect(test).toEqual({ ok: true, value: { jobId: 'job-1', ...report } });
  });

  it('incomplete test report maps to null', async () => {
    const { fetch } = fakeFetch(() => json(backendJob({ testReport: { passed: 3 } })));
    expect(await service(fetch).getTestStatus('job-1')).toEqual({ ok: true, value: null });
  });

  it('maps the clarification gate', async () => {
    const { fetch } = fakeFetch(() => json(backendJob({ status: 'WAITING_FOR_USER', clarificationQuestion: 'Welches CRM?' })));
    const http = service(fetch);
    const [job, gate] = await Promise.all([http.getJobStatus('job-1'), http.getHumanGateState('job-1')]);
    expect(job.ok && job.value.status).toBe('awaiting_human');
    expect(gate).toEqual({
      ok: true,
      value: { jobId: 'job-1', type: 'clarification', status: 'awaiting_human', requestedAt: UPDATED_AT, question: 'Welches CRM?' },
    });
  });

  it('maps the approval gate', async () => {
    const { fetch } = fakeFetch(() => json(backendJob({ status: 'WAITING_FOR_APPROVAL' })));
    expect(await service(fetch).getHumanGateState('job-1')).toEqual({
      ok: true,
      value: { jobId: 'job-1', type: 'approval', status: 'awaiting_human', requestedAt: UPDATED_AT },
    });
  });

  it('reads of one job share a single GET; unsupported reads make no request', async () => {
    const { fetch, calls } = fakeFetch(() => json(backendJob()));
    const http = service(fetch);
    const results = await Promise.all([
      http.getJobStatus('job-1'),
      http.getGeneratedWorkflow('job-1'),
      http.getTestStatus('job-1'),
      http.getExecutionStatus('job-1'),
      http.getHumanGateState('job-1'),
      http.getProductionMetrics('job-1'),
    ]);
    expect(calls).toHaveLength(1);
    expect(results.every((result) => result.ok)).toBe(true);
    expect(results[1]).toEqual({ ok: true, value: null });
  });

  it('no cache beyond the in-flight request', async () => {
    const { fetch, calls } = fakeFetch(
      () => json(backendJob()),
      () => json(backendJob({ version: 4 })),
    );
    const http = service(fetch);
    await http.getJobStatus('job-1');
    const second = await http.getJobStatus('job-1');
    expect(calls).toHaveLength(2);
    expect(second.ok && second.value.version).toBe(4);
  });

  it('clarification body is exactly {jobId, humanResponse}, followed by a GET', async () => {
    const { fetch, calls } = fakeFetch(
      () => json({ jobId: 'job-1', version: 5, status: 'PLANNED', testReport: null, errorMessage: null, clarificationQuestion: null }),
      () => json(backendJob({ version: 5, status: 'PLANNED' })),
    );
    const result = await service(fetch).submitClarification({ jobId: 'job-1', response: 'HubSpot' });
    expect(calls[0]?.body).toStrictEqual({ jobId: 'job-1', humanResponse: 'HubSpot' });
    expect(calls[0]?.url).toBe(`${BASE}/api/orchestrator`);
    expect(calls[1]?.method).toBe('GET');
    expect(result.ok && result.value.version).toBe(5);
  });

  it('clarification rejects empty jobId or response without HTTP', async () => {
    const { fetch, calls } = fakeFetch();
    const http = service(fetch);
    expect(await http.submitClarification({ jobId: '', response: 'x' })).toMatchObject({ ok: false, error: { code: 'VALIDATION' } });
    expect(await http.submitClarification({ jobId: 'job-1', response: '  ' })).toMatchObject({ ok: false, error: { code: 'VALIDATION' } });
    expect(calls).toHaveLength(0);
  });

  it('approval body is exactly {jobId, version, approve}, followed by a GET', async () => {
    const { fetch, calls } = fakeFetch(
      () => json({ ok: true }),
      () => json(backendJob({ version: 9, status: 'APPROVED' })),
    );
    const result = await service(fetch).submitApproval({ jobId: 'job-1', version: 8, approve: true });
    expect(calls[0]).toMatchObject({ url: `${BASE}/api/orchestrator/approve`, method: 'POST' });
    expect(calls[0]?.body).toStrictEqual({ jobId: 'job-1', version: 8, approve: true });
    expect(result.ok && result.value.status).toBe('approved');
  });

  it('409 on approval yields exactly one POST and the error', async () => {
    const { fetch, calls } = fakeFetch(() => json({ error: 'version conflict' }, 409));
    const result = await service(fetch).submitApproval({ jobId: 'job-1', version: 2, approve: true });
    expect(calls).toHaveLength(1);
    expect(result).toEqual({
      ok: false,
      error: { kind: 'http', httpStatus: 409, code: 'VERSION_CONFLICT', message: 'version conflict' },
    });
  });

  it('allows at most one approval in flight per job', async () => {
    let release: (response: Response) => void = () => undefined;
    const { fetch, calls } = fakeFetch(
      () => new Promise<Response>((resolve) => (release = resolve)),
      () => json(backendJob({ status: 'APPROVED', version: 4 })),
    );
    const http = service(fetch);
    const first = http.submitApproval({ jobId: 'job-1', version: 3, approve: true });
    const second = await http.submitApproval({ jobId: 'job-1', version: 3, approve: false });
    expect(second).toMatchObject({ ok: false, error: { code: 'APPROVAL_IN_FLIGHT' } });
    release(json({}));
    expect((await first).ok).toBe(true);
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(1);
  });

  it.each([
    [400, 'VALIDATION'],
    [401, 'UNAUTHORIZED'],
    [404, 'NOT_FOUND'],
    [500, 'SERVER'],
    [503, 'SERVER'],
  ])('maps HTTP %i to code %s', async (status, code) => {
    const { fetch } = fakeFetch(() => text('Fehlertext', status));
    expect(await service(fetch).getJobStatus('job-1')).toEqual({
      ok: false,
      error: { kind: 'http', httpStatus: status, code, message: 'Fehlertext' },
    });
  });

  it('uses the JSON error message of a 500', async () => {
    const { fetch } = fakeFetch(() => json({ error: 'boom' }, 500));
    expect(await service(fetch).getJobStatus('job-1')).toMatchObject({ ok: false, error: { code: 'SERVER', message: 'boom' } });
  });

  it('maps network failures', async () => {
    const { fetch } = fakeFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    expect(await service(fetch).getJobStatus('job-1')).toEqual({
      ok: false,
      error: { kind: 'network', code: 'NETWORK', message: 'Failed to fetch' },
    });
  });

  it('maps timeouts', async () => {
    vi.useFakeTimers();
    const hanging = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        }),
    );
    const pending = service(hanging as unknown as typeof fetch, { getTimeoutMs: 50 }).getJobStatus('job-1');
    await vi.advanceTimersByTimeAsync(60);
    expect(await pending).toMatchObject({ ok: false, error: { kind: 'network', code: 'TIMEOUT' } });
  });

  it('unknown backend status yields UNKNOWN_FACTORY_STATUS', async () => {
    const { fetch } = fakeFetch(() => json(backendJob({ status: 'DANCING' })));
    expect(await service(fetch).getJobStatus('job-1')).toMatchObject({
      ok: false,
      error: { kind: 'invalidResponse', code: 'UNKNOWN_FACTORY_STATUS' },
    });
  });

  it.each([
    ['version as string', { version: '7' }],
    ['missing jobId', { jobId: undefined }],
    ['non-ISO timestamp', { updatedAt: 'gestern' }],
    ['non-string clarificationQuestion', { clarificationQuestion: 42 }],
  ])('invalid payload (%s) yields INVALID_PAYLOAD', async (_name, overrides) => {
    const { fetch } = fakeFetch(() => json(backendJob(overrides)));
    expect(await service(fetch).getJobStatus('job-1')).toMatchObject({
      ok: false,
      error: { kind: 'invalidResponse', code: 'INVALID_PAYLOAD' },
    });
  });

  it('passes an injected credentials mode', async () => {
    const { fetch, calls } = fakeFetch(() => json(backendJob()));
    await new HttpFactoryService({ baseUrl: BASE, fetch, credentials: 'include' }).getJobStatus('job-1');
    expect(calls[0]?.credentials).toBe('include');
  });
});
