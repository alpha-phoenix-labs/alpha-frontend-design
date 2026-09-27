import type {
  ApiError,
  FactoryJob,
  FactoryResult,
  HumanGateState,
  TestReportV1,
  WorkflowExecutionResult,
  WorkflowGenerationResult,
  WorkflowProductionMetrics,
  WorkflowRequest,
} from '@/types/factory/index.ts';
import type {
  FactoryService,
  SubmitApprovalInput,
  SubmitClarificationInput,
} from '@/services/factory/FactoryService.ts';
import { mapSnapshot, parseJobPayload, type FactorySnapshot } from '@/services/factory/mapper.ts';

/** Default timeout of a job snapshot GET in milliseconds. */
export const DEFAULT_GET_TIMEOUT_MS = 10_000;
/** Default timeout of a POST in milliseconds; the orchestrator answers synchronously up to the next gate. */
export const DEFAULT_POST_TIMEOUT_MS = 300_000;

export interface HttpFactoryServiceOptions {
  /** Validated base URL without trailing slash; endpoints live under `${baseUrl}/api/orchestrator`. */
  readonly baseUrl: string;
  readonly fetch?: typeof fetch;
  /** Credentials mode of every request; defaults to `include`. */
  readonly credentials?: RequestCredentials;
  readonly getTimeoutMs?: number;
  readonly postTimeoutMs?: number;
}

type HttpOutcome =
  | { readonly ok: true; readonly body: unknown }
  | { readonly ok: false; readonly error: ApiError; readonly mutationUnconfirmed: boolean };

type MutationUnconfirmedError = ApiError & { readonly jobId?: string };

const ok = <T>(value: T): FactoryResult<T> => ({ ok: true, value });
const fail = <T>(error: ApiError): FactoryResult<T> => ({ ok: false, error });

const validationError = (message: string): ApiError => ({ kind: 'unknown', code: 'VALIDATION', message });

function mutationUnconfirmed(error: ApiError, jobId?: string): MutationUnconfirmedError {
  const message =
    jobId === undefined
      ? `Mutation möglicherweise erfolgreich, aber nicht bestätigt: ${error.message}`
      : `Mutation für Job ${jobId} möglicherweise erfolgreich, aber nicht bestätigt: ${error.message}`;
  return jobId === undefined
    ? { ...error, code: 'MUTATION_UNCONFIRMED', message }
    : { ...error, code: 'MUTATION_UNCONFIRMED', message, jobId };
}

function jobIdOf(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('jobId' in value)) {
    return undefined;
  }
  const jobId = (value as { readonly jobId?: unknown }).jobId;
  return typeof jobId === 'string' && jobId.trim() !== '' ? jobId : undefined;
}

function httpErrorCode(status: number): string {
  if (status === 400) return 'VALIDATION';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'VERSION_CONFLICT';
  if (status >= 500) return 'SERVER';
  return 'HTTP_ERROR';
}

/** Extracts a readable message from a plain-text or JSON `{ error }` error body. */
function errorMessageOf(text: string, status: number): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (typeof parsed === 'object' && parsed !== null && 'error' in parsed && typeof parsed.error === 'string') {
        return parsed.error;
      }
    } catch {
      // Fall through to the raw text.
    }
  }
  return trimmed === '' ? `HTTP ${status}` : trimmed;
}

/** Factory service backed by the orchestrator HTTP API. Never throws; concurrent reads of a job share one GET. */
export class HttpFactoryService implements FactoryService {
  readonly #baseUrl: string;
  readonly #fetch: typeof fetch;
  readonly #credentials: RequestCredentials;
  readonly #getTimeoutMs: number;
  readonly #postTimeoutMs: number;
  /** In-flight snapshot GETs per job id; entries are removed once settled (no cache). */
  readonly #snapshots = new Map<string, Promise<FactoryResult<FactorySnapshot>>>();
  /** Job ids with an approval in flight. */
  readonly #approvals = new Set<string>();
  /** Requests submitted by this client, used to fill `FactoryJob.request`. */
  readonly #requests = new Map<string, WorkflowRequest>();

  constructor(options: HttpFactoryServiceOptions) {
    this.#baseUrl = options.baseUrl;
    this.#fetch = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.#credentials = options.credentials ?? 'include';
    this.#getTimeoutMs = options.getTimeoutMs ?? DEFAULT_GET_TIMEOUT_MS;
    this.#postTimeoutMs = options.postTimeoutMs ?? DEFAULT_POST_TIMEOUT_MS;
  }

  readonly submitWorkflowRequest = async (request: WorkflowRequest): Promise<FactoryResult<FactoryJob>> => {
    if (request.description.trim() === '') {
      return fail(validationError('Die Beschreibung ist leer.'));
    }
    const posted = await this.#post('/api/orchestrator', { prompt: request.description });
    if (!posted.ok) {
      return posted;
    }
    this.#requests.set(posted.value, request);
    return this.#jobAfterMutation(posted.value);
  };

  readonly getJobStatus = (jobId: string): Promise<FactoryResult<FactoryJob>> =>
    this.#readSnapshot(jobId, (snapshot) => snapshot.job);

  readonly getGeneratedWorkflow = (_jobId: string): Promise<FactoryResult<WorkflowGenerationResult | null>> =>
    Promise.resolve(ok(null));

  readonly getTestStatus = (jobId: string): Promise<FactoryResult<TestReportV1 | null>> =>
    this.#readSnapshot(jobId, (snapshot) => snapshot.testResult);

  readonly getExecutionStatus = (_jobId: string): Promise<FactoryResult<WorkflowExecutionResult | null>> =>
    Promise.resolve(ok(null));

  readonly getHumanGateState = (jobId: string): Promise<FactoryResult<HumanGateState | null>> =>
    this.#readSnapshot(jobId, (snapshot) => snapshot.humanGate);

  readonly submitApproval = async (input: SubmitApprovalInput): Promise<FactoryResult<FactoryJob>> => {
    if (input.jobId.trim() === '' || !Number.isInteger(input.version)) {
      return fail(validationError('Job-ID oder Version ist ungültig.'));
    }
    if (this.#approvals.has(input.jobId)) {
      return fail({
        kind: 'unknown',
        code: 'APPROVAL_IN_FLIGHT',
        message: `Für Job ${input.jobId} läuft bereits eine Freigabe-Entscheidung.`,
      });
    }
    this.#approvals.add(input.jobId);
    try {
      const outcome = await this.#send('POST', '/api/orchestrator/approve', this.#postTimeoutMs, {
        jobId: input.jobId,
        version: input.version,
        approve: input.approve,
      });
      // No retry on 409: the caller refreshes and decides again on the current version.
      if (!outcome.ok) {
        return outcome.mutationUnconfirmed
          ? fail(mutationUnconfirmed(outcome.error, input.jobId))
          : fail(outcome.error);
      }
      return this.#jobAfterMutation(input.jobId);
    } finally {
      this.#approvals.delete(input.jobId);
    }
  };

  readonly submitClarification = async (input: SubmitClarificationInput): Promise<FactoryResult<FactoryJob>> => {
    if (input.jobId.trim() === '' || input.response.trim() === '') {
      return fail(validationError('Job-ID und Antwort dürfen nicht leer sein.'));
    }
    const posted = await this.#post(
      '/api/orchestrator',
      { jobId: input.jobId, humanResponse: input.response },
      input.jobId,
    );
    return posted.ok ? this.#jobAfterMutation(input.jobId) : posted;
  };

  readonly getProductionMetrics = (_jobId: string): Promise<FactoryResult<WorkflowProductionMetrics | null>> =>
    Promise.resolve(ok(null));

  /** POSTs to the orchestrator and validates the job payload of the answer; resolves to the job id. */
  async #post(path: string, body: object, knownJobId?: string): Promise<FactoryResult<string>> {
    const outcome = await this.#send('POST', path, this.#postTimeoutMs, body);
    if (!outcome.ok) {
      return outcome.mutationUnconfirmed
        ? fail(mutationUnconfirmed(outcome.error, knownJobId))
        : fail(outcome.error);
    }
    const payload = parseJobPayload(outcome.body, false);
    if (!payload.ok) {
      return fail(mutationUnconfirmed(payload.error, jobIdOf(outcome.body) ?? knownJobId));
    }
    return ok(payload.value.jobId);
  }

  /** Fresh GET after a mutation (never joins a GET started before it) to obtain timestamps and the current state. */
  async #jobAfterMutation(jobId: string): Promise<FactoryResult<FactoryJob>> {
    const snapshot = await this.#loadSnapshot(jobId, true);
    return snapshot.ok ? ok(snapshot.value.job) : fail(mutationUnconfirmed(snapshot.error, jobId));
  }

  #readSnapshot<T>(jobId: string, pick: (snapshot: FactorySnapshot) => T): Promise<FactoryResult<T>> {
    if (jobId.trim() === '') {
      return Promise.resolve(fail(validationError('Job-ID ist leer.')));
    }
    // loadSnapshot runs synchronously here so that concurrent reads join the same in-flight GET.
    return this.#loadSnapshot(jobId, false).then((snapshot) => (snapshot.ok ? ok(pick(snapshot.value)) : snapshot));
  }

  #loadSnapshot(jobId: string, fresh: boolean): Promise<FactoryResult<FactorySnapshot>> {
    const inFlight = this.#snapshots.get(jobId);
    if (inFlight !== undefined && !fresh) {
      return inFlight;
    }
    const promise = this.#fetchSnapshot(jobId).finally(() => {
      if (this.#snapshots.get(jobId) === promise) {
        this.#snapshots.delete(jobId);
      }
    });
    this.#snapshots.set(jobId, promise);
    return promise;
  }

  async #fetchSnapshot(jobId: string): Promise<FactoryResult<FactorySnapshot>> {
    const outcome = await this.#send('GET', `/api/orchestrator?jobId=${encodeURIComponent(jobId)}`, this.#getTimeoutMs);
    if (!outcome.ok) {
      return fail(outcome.error);
    }
    const payload = parseJobPayload(outcome.body, true);
    if (!payload.ok) {
      return payload;
    }
    if (payload.value.jobId !== jobId) {
      return fail({ kind: 'invalidResponse', code: 'INVALID_PAYLOAD', message: 'Antwort gehört zu einem anderen Job.' });
    }
    return mapSnapshot(payload.value, this.#requests.get(jobId));
  }

  /** Performs one request with timeout; maps every failure to an {@link ApiError}. Never throws. */
  async #send(method: 'GET' | 'POST', path: string, timeoutMs: number, body?: object): Promise<HttpOutcome> {
    const controller = new AbortController();
    let timedOut = false;
    let requestDispatched = false;
    let response: Response | undefined;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    try {
      const init: RequestInit = {
        method,
        credentials: this.#credentials,
        signal: controller.signal,
        headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      };
      const requestInit = body === undefined ? init : { ...init, body: JSON.stringify(body) };
      requestDispatched = true;
      response = await this.#fetch(`${this.#baseUrl}${path}`, requestInit);
      const text = await response.text();
      if (!response.ok) {
        return {
          ok: false,
          error: {
            kind: 'http',
            httpStatus: response.status,
            code: httpErrorCode(response.status),
            message: errorMessageOf(text, response.status),
          },
          mutationUnconfirmed: false,
        };
      }
      try {
        return { ok: true, body: JSON.parse(text) as unknown };
      } catch {
        return {
          ok: false,
          error: { kind: 'invalidResponse', code: 'INVALID_PAYLOAD', message: 'Antwort ist kein gültiges JSON.' },
          mutationUnconfirmed: method === 'POST',
        };
      }
    } catch (cause) {
      if (response !== undefined && !response.ok) {
        return {
          ok: false,
          error: {
            kind: 'http',
            httpStatus: response.status,
            code: httpErrorCode(response.status),
            message: `HTTP ${response.status}`,
          },
          mutationUnconfirmed: false,
        };
      }
      const error: ApiError = timedOut
        ? { kind: 'network', code: 'TIMEOUT', message: `Keine Antwort nach ${timeoutMs} ms.` }
        : { kind: 'network', code: 'NETWORK', message: cause instanceof Error ? cause.message : 'Netzwerkfehler.' };
      return {
        ok: false,
        error,
        mutationUnconfirmed: method === 'POST' && requestDispatched,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
