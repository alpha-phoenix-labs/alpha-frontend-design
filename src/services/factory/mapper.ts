import type {
  ApiError,
  FactoryJob,
  FactoryResult,
  HumanGateState,
  JobStatus,
  TestReportV1,
  WorkflowRequest,
} from '@/types/factory/index.ts';

/** Job statuses of the orchestrator backend. */
export const BACKEND_STATUSES = [
  'CREATED',
  'WAITING_FOR_USER',
  'PLANNED',
  'BUILDING',
  'SECURITY_REVIEW',
  'TESTING',
  'WAITING_FOR_APPROVAL',
  'APPROVED',
  'COMPLETED',
  'FAILED',
  'BLOCKED',
] as const;

export type BackendStatus = (typeof BACKEND_STATUSES)[number];

/** Backend status to central {@link JobStatus}. Both WAITING_* statuses map to `awaiting_human`; the gate type tells them apart. */
export const BACKEND_STATUS_TO_JOB_STATUS = {
  CREATED: 'queued',
  WAITING_FOR_USER: 'awaiting_human',
  PLANNED: 'generating',
  BUILDING: 'generating',
  SECURITY_REVIEW: 'generated',
  TESTING: 'testing',
  WAITING_FOR_APPROVAL: 'awaiting_human',
  APPROVED: 'approved',
  COMPLETED: 'completed',
  FAILED: 'failed',
  BLOCKED: 'blocked',
} as const satisfies Record<BackendStatus, JobStatus>;

/** Validated orchestrator job payload. Timestamps are absent in POST responses. */
export interface BackendJobPayload {
  readonly jobId: string;
  readonly version: number;
  readonly status: BackendStatus;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly testReport: TestReportV1 | null;
  readonly errorMessage: string | null;
  readonly clarificationQuestion: string | null;
}

/** Everything a single GET of a job yields. */
export interface FactorySnapshot {
  readonly job: FactoryJob;
  readonly testResult: TestReportV1 | null;
  readonly humanGate: HumanGateState | null;
}

const TEST_REPORT_RESULTS: readonly TestReportV1['result'][] = ['PASS', 'NOT_RUN', 'NOT_PASS'];
const TEST_REPORT_OPTIONAL_FIELDS = ['reason', 'importedId', 'executionId', 'evidence'] as const;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

type JsonObject = Readonly<Record<string, unknown>>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBackendStatus = (value: unknown): value is BackendStatus =>
  typeof value === 'string' && (BACKEND_STATUSES as readonly string[]).includes(value);

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && ISO_TIMESTAMP.test(value) && !Number.isNaN(Date.parse(value));

const isNullableString = (value: unknown): value is string | null | undefined =>
  value === undefined || value === null || typeof value === 'string';

export function invalidPayload(message: string): ApiError {
  return { kind: 'invalidResponse', code: 'INVALID_PAYLOAD', message };
}

/**
 * Validates and sanitizes the public TestReportV1 at the network boundary.
 * Unknown response fields are ignored; known fields are never inferred or repaired.
 */
export function parseTestReportV1(report: unknown, outerJobId: string): FactoryResult<TestReportV1 | null> {
  if (report === null) {
    return { ok: true, value: null };
  }
  if (!isObject(report)) {
    return { ok: false, error: invalidPayload('testReport ist weder null noch ein JSON-Objekt.') };
  }
  if (report.contractVersion !== '1.0') {
    return { ok: false, error: invalidPayload('testReport.contractVersion fehlt oder ist nicht 1.0.') };
  }
  if (typeof report.jobId !== 'string' || report.jobId === '') {
    return { ok: false, error: invalidPayload('testReport.jobId fehlt oder ist kein String.') };
  }
  if (report.jobId !== outerJobId) {
    return { ok: false, error: invalidPayload('testReport.jobId stimmt nicht mit jobId überein.') };
  }
  if (
    typeof report.result !== 'string' ||
    !(TEST_REPORT_RESULTS as readonly string[]).includes(report.result)
  ) {
    return { ok: false, error: invalidPayload('testReport.result ist ungültig.') };
  }

  const optional: Record<string, string> = {};
  for (const key of TEST_REPORT_OPTIONAL_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(report, key)) {
      continue;
    }
    const value = report[key];
    if (typeof value !== 'string') {
      return { ok: false, error: invalidPayload(`testReport.${key} ist kein String.`) };
    }
    optional[key] = value;
  }

  return {
    ok: true,
    value: {
      contractVersion: '1.0',
      jobId: report.jobId,
      result: report.result as TestReportV1['result'],
      ...optional,
    },
  };
}

/**
 * Validates an orchestrator job payload. With `requireTimestamps` (GET), `createdAt`/`updatedAt` must be ISO timestamps;
 * otherwise (POST) they are ignored. Unknown statuses yield `UNKNOWN_FACTORY_STATUS`, other defects `INVALID_PAYLOAD`.
 */
export function parseJobPayload(raw: unknown, requireTimestamps: boolean): FactoryResult<BackendJobPayload> {
  if (!isObject(raw)) {
    return { ok: false, error: invalidPayload('Antwort der Factory ist kein JSON-Objekt.') };
  }
  const { jobId, version, status, createdAt, updatedAt, testReport, errorMessage, clarificationQuestion } = raw;
  if (typeof jobId !== 'string' || jobId === '') {
    return { ok: false, error: invalidPayload('jobId fehlt oder ist kein String.') };
  }
  if (!Number.isInteger(version) || (version as number) < 0) {
    return { ok: false, error: invalidPayload('version fehlt, ist keine ganze Zahl oder ist negativ.') };
  }
  if (typeof status !== 'string') {
    return { ok: false, error: invalidPayload('status fehlt oder ist kein String.') };
  }
  if (!isBackendStatus(status)) {
    return {
      ok: false,
      error: { kind: 'invalidResponse', code: 'UNKNOWN_FACTORY_STATUS', message: `Unbekannter Factory-Status: ${status}` },
    };
  }
  if (requireTimestamps && (!isIsoTimestamp(createdAt) || !isIsoTimestamp(updatedAt))) {
    return { ok: false, error: invalidPayload('createdAt/updatedAt fehlen oder sind keine ISO-Zeitstempel.') };
  }
  if (!isNullableString(clarificationQuestion)) {
    return { ok: false, error: invalidPayload('clarificationQuestion ist weder String noch null.') };
  }
  if (!isNullableString(errorMessage)) {
    return { ok: false, error: invalidPayload('errorMessage ist weder String noch null.') };
  }
  if (
    status === 'WAITING_FOR_USER' &&
    (typeof clarificationQuestion !== 'string' || clarificationQuestion.trim() === '')
  ) {
    return { ok: false, error: invalidPayload('WAITING_FOR_USER benötigt eine clarificationQuestion.') };
  }

  const parsedTestReport = parseTestReportV1(testReport, jobId);
  if (!parsedTestReport.ok) {
    return { ok: false, error: parsedTestReport.error };
  }

  return {
    ok: true,
    value: {
      jobId,
      version: version as number,
      status,
      createdAt: isIsoTimestamp(createdAt) ? createdAt : null,
      updatedAt: isIsoTimestamp(updatedAt) ? updatedAt : null,
      testReport: parsedTestReport.value,
      errorMessage: errorMessage ?? null,
      clarificationQuestion: clarificationQuestion ?? null,
    },
  };
}

/** Human gate derived from the backend status; only open gates can be derived without inventing timestamps. */
function mapHumanGate(payload: BackendJobPayload, requestedAt: string): HumanGateState | null {
  switch (payload.status) {
    case 'WAITING_FOR_USER':
      return payload.clarificationQuestion === null
        ? null
        : {
            jobId: payload.jobId,
            type: 'clarification',
            status: 'awaiting_human',
            requestedAt,
            question: payload.clarificationQuestion,
          };
    case 'WAITING_FOR_APPROVAL':
      return { jobId: payload.jobId, type: 'approval', status: 'awaiting_human', requestedAt };
    default:
      return null;
  }
}

/** Maps a validated GET payload (with timestamps) to a snapshot. `request` is only set when known locally. */
export function mapSnapshot(payload: BackendJobPayload, request: WorkflowRequest | undefined): FactoryResult<FactorySnapshot> {
  if (payload.createdAt === null || payload.updatedAt === null) {
    return { ok: false, error: invalidPayload('createdAt/updatedAt fehlen.') };
  }
  const base: FactoryJob = {
    id: payload.jobId,
    version: payload.version,
    status: BACKEND_STATUS_TO_JOB_STATUS[payload.status],
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
  const withRequest: FactoryJob = request === undefined ? base : { ...base, request };
  const job: FactoryJob =
    payload.errorMessage === null
      ? withRequest
      : { ...withRequest, error: { kind: 'unknown', code: 'FACTORY_JOB_ERROR', message: payload.errorMessage } };
  return {
    ok: true,
    value: {
      job,
      testResult: payload.testReport,
      humanGate: mapHumanGate(payload, payload.updatedAt),
    },
  };
}
