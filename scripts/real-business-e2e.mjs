import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`MISSING_REQUIRED_ENV:${name}`);
  return value;
};

const previewUrl = required('E2E_PREVIEW_URL').replace(/\/+$/, '');
const backendUrl = required('E2E_BACKEND_URL').replace(/\/+$/, '');
const email = required('E2E_OWNER_EMAIL');
const password = required('E2E_OWNER_PASSWORD');
const prompt = process.env.E2E_BUSINESS_PROMPT?.trim() ||
  'Create a minimal n8n workflow that receives a webhook POST with JSON and returns a JSON response containing ok=true. No external services, no credentials, no dynamic URLs.';

// R-05: every run carries a correlationId so the backend can remove exactly this run's test artifacts.
const correlationId = process.env.CORRELATION_ID?.trim() ||
  `craftflow-e2e-${process.env.GITHUB_RUN_ID ?? 'local'}-${process.env.GITHUB_RUN_ATTEMPT ?? '1'}-${Date.now()}`;
const keepArtifacts = process.env.E2E_KEEP_ARTIFACTS?.trim() === 'true';
// R-08: optional recovery when the create request times out (0 = disabled, default for Real E2E/Gate).
const createRecoveryMs = Math.max(0, Math.min(900_000, Number(process.env.E2E_CREATE_RECOVERY_MS) || 0));
const RUNNING_STATUSES = new Set(['CREATED', 'PLANNED', 'BUILDING', 'SECURITY_REVIEW', 'TESTING', 'APPROVED']);
// R-08 async: a 202 create means the backend worker runs the pipeline; the persisted job is polled
// until it leaves the pre-approval statuses (bounded; default 10 min, max 30 min).
const PIPELINE_STATUSES = new Set(['CREATED', 'PLANNED', 'BUILDING', 'SECURITY_REVIEW', 'TESTING']);
const jobWaitMs = Math.max(10_000, Math.min(1_800_000, Number(process.env.E2E_JOB_WAIT_MS) || 600_000));
// The backend must run exactly the pinned commit; checked with the OWNER session before any job is created.
const backendPin = JSON.parse(readFileSync(new URL('../config/backend-runtime-truth.json', import.meta.url), 'utf8'));
const RUNTIME_TRUTH_FIELDS = ['repository', 'branch', 'commitSha', 'serviceId'];

const evidence = {
  frontendSha: process.env.E2E_FRONTEND_SHA ?? null,
  correlationId,
  phase: 'initialization',
  jobId: null,
  submittedStatus: null,
  waitingForApproval: false,
  approvalVersion: null,
  approvalMode: process.env.E2E_APPROVAL_MODE?.trim() || 'AUTOMATED_TEST_APPROVAL',
  n8n: { pass: false, executionId: null, importedId: null },
  completed: false,
  drive: {
    status: null,
    auftragFileId: null,
    workflowFileId: null,
    testReportFileId: null,
    finalWorkflowFileId: null,
    documentationFileId: null,
    persistedReportMatches: false,
  },
  runtimeTruth: { status: null, expected: backendPin, actual: null, matches: false },
  cleanup: { marked: false, status: 'NOT_RUN', reason: null, n8n: null, drive: null },
  // R-08: sizes and durations only (backend runMetrics v1 + client-side wall time).
  promptChars: prompt.length,
  createErrorMessage: null,
  timingMs: { create: null, pipeline: null, approve: null, total: null },
  runMetrics: { create: null, approve: null },
  clientRequestId: null,
  createTimedOut: false,
  recovery: null,
  createHttpStatus: null,
  asyncWait: null,
};
const startedAt = Date.now();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const fail = (message) => { throw new Error(message); };
const jsonOf = async (response) => {
  try { return await response.json(); } catch { return null; }
};
const nonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const driveArtifactId = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{6,}$/.test(value);
const backendGet = (path) => page.evaluate(async (url) => {
  const response = await fetch(url, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' }, cache: 'no-store' });
  let json = null;
  try { json = await response.json(); } catch {}
  return { status: response.status, body: json };
}, `${backendUrl}${path}`);
const markTestJob = async () => {
  try {
    const marked = await backendPost('/api/orchestrator/test-mark', { jobId: evidence.jobId, correlationId });
    evidence.cleanup.marked = marked.status === 200 &&
      (marked.body?.status === 'MARKED' || marked.body?.status === 'ALREADY_MARKED');
    if (!evidence.cleanup.marked) evidence.cleanup.reason = `TEST_MARK_HTTP_${marked.status}`;
  } catch {
    evidence.cleanup.reason = 'TEST_MARK_REQUEST_FAILED';
  }
};
// After a create timeout the job keeps running server-side: find it by clientRequestId, mark it
// immediately (15 min mark window) and wait for a terminal status so cleanup and metrics are complete.
const waitForPipeline = async (jobId) => {
  const wait = { polls: 0, waitedMs: 0, lastStatus: null, lookupStatus: null };
  evidence.asyncWait = wait;
  const waitStartedAt = Date.now();
  let snapshot = null;
  while (Date.now() - waitStartedAt < jobWaitMs) {
    await page.waitForTimeout(3000);
    wait.polls += 1;
    const found = await backendGet(`/api/orchestrator?jobId=${encodeURIComponent(jobId)}`).catch(() => ({ status: 0, body: null }));
    wait.lookupStatus = found.status;
    if (found.status === 200 && found.body?.jobId === jobId) {
      snapshot = found.body;
      wait.lastStatus = snapshot.status ?? null;
      if (!PIPELINE_STATUSES.has(wait.lastStatus)) break;
    }
  }
  wait.waitedMs = Date.now() - waitStartedAt;
  return snapshot;
};
const recoverAfterCreateTimeout = async () => {
  const recovery = { attempted: Boolean(evidence.clientRequestId) && createRecoveryMs > 0, polls: 0, waitedMs: 0, finalStatus: null, lookupStatus: null };
  evidence.recovery = recovery;
  if (!recovery.attempted) return;
  const startedAt = Date.now();
  const path = `/api/orchestrator?clientRequestId=${encodeURIComponent(evidence.clientRequestId)}`;
  while (Date.now() - startedAt <= createRecoveryMs) {
    recovery.polls += 1;
    const found = await backendGet(path).catch(() => ({ status: 0, body: null }));
    recovery.lookupStatus = found.status;
    if (found.status === 200 && typeof found.body?.jobId === 'string') {
      if (!evidence.jobId) {
        evidence.jobId = found.body.jobId;
        await markTestJob();
      }
      recovery.finalStatus = found.body.status ?? null;
      evidence.runMetrics.create = found.body.runMetrics ?? evidence.runMetrics.create;
      if (!RUNNING_STATUSES.has(recovery.finalStatus)) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  recovery.waitedMs = Date.now() - startedAt;
};
const backendPost = (path, body) => page.evaluate(async ({ url, body }) => {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  let json = null;
  try { json = await response.json(); } catch {}
  return { status: response.status, body: json };
}, { url: `${backendUrl}${path}`, body });

try {
  evidence.phase = 'frontend-auth-gate';
  await page.goto(previewUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  const loginButton = page.getByTestId('auth-login-button');
  await loginButton.waitFor({ state: 'visible', timeout: 15_000 });

  evidence.phase = 'owner-login';
  const popupPromise = context.waitForEvent('page', { timeout: 10_000 });
  await loginButton.click();
  const loginPage = await popupPromise;
  await loginPage.waitForLoadState('networkidle', { timeout: 30_000 });
  await loginPage.locator('input[name="email"]').fill(email);
  await loginPage.locator('input[name="password"]').fill(password);
  await Promise.all([
    loginPage.waitForLoadState('networkidle'),
    loginPage.locator('button[type="submit"]').click(),
  ]);

  const workspace = page.getByPlaceholder('Describe the workflow you want Craftflow to build');
  await workspace.waitFor({ state: 'visible', timeout: 20_000 });

  evidence.phase = 'runtime-truth';
  const runtimeTruth = await page.evaluate(async (url) => {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    let body = null;
    try { body = await response.json(); } catch {}
    return { status: response.status, body };
  }, `${backendUrl}/api/runtime-truth`);
  evidence.runtimeTruth.status = runtimeTruth.status;
  evidence.runtimeTruth.actual = runtimeTruth.body && typeof runtimeTruth.body === 'object'
    ? Object.fromEntries(RUNTIME_TRUTH_FIELDS.map((key) => [key, runtimeTruth.body[key] ?? null]))
    : null;
  if (runtimeTruth.status !== 200) fail(`BUSINESS_E2E_RUNTIME_TRUTH_UNAVAILABLE:${runtimeTruth.status}`);
  evidence.runtimeTruth.matches = RUNTIME_TRUTH_FIELDS.every(
    (key) => nonEmptyString(backendPin[key]) && evidence.runtimeTruth.actual?.[key] === backendPin[key],
  );
  if (!evidence.runtimeTruth.matches) fail('BUSINESS_E2E_RUNTIME_TRUTH_MISMATCH');

  evidence.phase = 'create-job-via-frontend';
  const createResponsePromise = page.waitForResponse(
    (response) => response.url() === `${backendUrl}/api/orchestrator` &&
      response.request().method() === 'POST',
    { timeout: 320_000 },
  );
  const createRequestPromise = page.waitForRequest(
    (request) => request.url() === `${backendUrl}/api/orchestrator` && request.method() === 'POST',
    { timeout: 30_000 },
  ).catch(() => null);
  await workspace.fill(prompt);
  const createStartedAt = Date.now();
  await workspace.press('Enter');
  const createRequest = await createRequestPromise;
  try { evidence.clientRequestId = createRequest?.postDataJSON()?.clientRequestId ?? null; } catch { evidence.clientRequestId = null; }
  let createResponse;
  try {
    createResponse = await createResponsePromise;
  } catch (error) {
    evidence.timingMs.create = Date.now() - createStartedAt;
    evidence.createTimedOut = true;
    evidence.phase = 'create-timeout-recovery';
    await recoverAfterCreateTimeout();
    throw error;
  }
  evidence.timingMs.create = Date.now() - createStartedAt;
  evidence.createHttpStatus = createResponse.status();
  let created = await jsonOf(createResponse);
  evidence.runMetrics.create = created?.runMetrics ?? null;
  evidence.createErrorMessage = typeof created?.errorMessage === 'string' ? created.errorMessage.slice(0, 300) : null;
  if (!createResponse.ok() || typeof created?.jobId !== 'string') fail('BUSINESS_E2E_CREATE_FAILED');
  evidence.jobId = created.jobId;
  evidence.submittedStatus = created.status ?? null;

  evidence.phase = 'test-mark';
  await markTestJob();

  if (createResponse.status() === 202) {
    evidence.phase = 'async-pipeline-wait';
    const settled = await waitForPipeline(created.jobId);
    evidence.timingMs.pipeline = Date.now() - createStartedAt;
    if (!settled || PIPELINE_STATUSES.has(settled.status)) fail(`BUSINESS_E2E_ASYNC_PIPELINE_TIMEOUT:${settled?.status ?? 'UNKNOWN'}`);
    created = settled;
    evidence.runMetrics.create = created.runMetrics ?? null;
    evidence.createErrorMessage = typeof created.errorMessage === 'string' ? created.errorMessage.slice(0, 300) : null;
    evidence.submittedStatus = created.status ?? null;
  }

  if (created.status === 'WAITING_FOR_USER') {
    fail('BUSINESS_E2E_UNEXPECTED_CLARIFICATION');
  }
  if (created.status !== 'WAITING_FOR_APPROVAL') {
    fail(`BUSINESS_E2E_NOT_AT_APPROVAL:${created.status ?? 'UNKNOWN'}`);
  }
  evidence.waitingForApproval = true;

  evidence.phase = 'verify-real-n8n-test';
  if (
    created.testReport?.contractVersion !== '1.0' ||
    created.testReport?.jobId !== evidence.jobId ||
    created.testReport?.result !== 'PASS' ||
    !nonEmptyString(created.testReport?.executionId) ||
    !nonEmptyString(created.testReport?.importedId)
  ) {
    fail('BUSINESS_E2E_N8N_TEST_NOT_PROVEN');
  }
  evidence.n8n.pass = true;
  evidence.n8n.executionId = created.testReport.executionId;
  evidence.n8n.importedId = created.testReport.importedId;

  evidence.phase = 'approval-gate';
  const status = page.locator('[data-testid="factory-status"]');
  await status.waitFor({ state: 'visible', timeout: 20_000 });
  if ((await status.textContent())?.trim() !== 'awaiting_human') {
    fail('BUSINESS_E2E_UI_NOT_AWAITING_HUMAN');
  }
  const versionNode = page.getByTestId('approval-version');
  await versionNode.waitFor({ state: 'visible', timeout: 20_000 });
  const versionText = (await versionNode.textContent())?.trim() ?? '';
  const versionMatch = versionText.match(/version\s+(\d+)/i);
  if (!versionMatch) fail('BUSINESS_E2E_APPROVAL_VERSION_MISSING');
  evidence.approvalVersion = Number(versionMatch[1]);

  evidence.phase = 'approval-via-frontend';
  const approvalResponsePromise = page.waitForResponse(
    (response) => response.url() === `${backendUrl}/api/orchestrator/approve` &&
      response.request().method() === 'POST',
    { timeout: 320_000 },
  );
  const approveStartedAt = Date.now();
  await page.getByRole('button', { name: 'Approve' }).click();
  const approvalResponse = await approvalResponsePromise;
  evidence.timingMs.approve = Date.now() - approveStartedAt;
  const approved = await jsonOf(approvalResponse);
  evidence.runMetrics.approve = approved?.runMetrics ?? null;
  if (!approvalResponse.ok()) fail(`BUSINESS_E2E_APPROVAL_HTTP_${approvalResponse.status()}`);
  if (approved?.jobId !== evidence.jobId || approved?.status !== 'COMPLETED') {
    fail('BUSINESS_E2E_NOT_COMPLETED');
  }
  evidence.completed = true;

  evidence.phase = 'drive-complete';
  const archive = approved?.archive;
  if (
    archive?.status !== 'COMPLETE' ||
    !driveArtifactId(archive.auftragFileId) ||
    !driveArtifactId(archive.workflowFileId) ||
    !driveArtifactId(archive.testReportFileId) ||
    !driveArtifactId(archive.finalWorkflowFileId) ||
    !driveArtifactId(archive.documentationFileId)
  ) {
    fail('BUSINESS_E2E_DRIVE_NOT_COMPLETE');
  }
  Object.assign(evidence.drive, archive);

  evidence.phase = 'drive-persistence-readback';
  const readback = await page.evaluate(async ({ url, jobId }) => {
    const response = await fetch(`${url}/api/orchestrator/archive`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    let body = null;
    try { body = await response.json(); } catch {}
    return { status: response.status, body };
  }, { url: backendUrl, jobId: evidence.jobId });

  const persisted = readback.body;
  if (
    readback.status !== 200 ||
    persisted?.status !== 'COMPLETE' ||
    persisted.auftragFileId !== archive.auftragFileId ||
    persisted.workflowFileId !== archive.workflowFileId ||
    persisted.testReportFileId !== archive.testReportFileId ||
    persisted.finalWorkflowFileId !== archive.finalWorkflowFileId ||
    persisted.documentationFileId !== archive.documentationFileId
  ) {
    fail('BUSINESS_E2E_DRIVE_PERSISTENCE_MISMATCH');
  }
  evidence.drive.persistedReportMatches = true;

  evidence.phase = 'final';
  console.log('REAL_BUSINESS_E2E_EVIDENCE=' + JSON.stringify(evidence));
  console.log('REAL_E2E_PASS');
} catch (error) {
  console.error('REAL_BUSINESS_E2E_EVIDENCE=' + JSON.stringify(evidence));
  console.error('::error::' + (error instanceof Error ? error.message : 'REAL_BUSINESS_E2E_FAIL'));
  process.exitCode = 1;
} finally {
  evidence.timingMs.total = Date.now() - startedAt;
  // R-05: cleanup is reported separately and never turns a failed run into PASS or a passed run into FAIL.
  if (evidence.jobId && evidence.cleanup.marked && !keepArtifacts) {
    try {
      const cleaned = await backendPost('/api/orchestrator/test-cleanup', { jobId: evidence.jobId, correlationId });
      evidence.cleanup.status = cleaned.body?.status ?? `TEST_CLEANUP_HTTP_${cleaned.status}`;
      evidence.cleanup.reason = cleaned.body?.reason ?? null;
      evidence.cleanup.n8n = cleaned.body?.n8n ?? null;
      evidence.cleanup.drive = cleaned.body?.drive ?? null;
    } catch {
      evidence.cleanup.status = 'CLEANUP_INCOMPLETE';
      evidence.cleanup.reason = 'TEST_CLEANUP_REQUEST_FAILED';
    }
  } else if (keepArtifacts) {
    evidence.cleanup.status = 'CLEANUP_SKIPPED_EVIDENCE';
  } else if (evidence.jobId) {
    evidence.cleanup.status = 'CLEANUP_SKIPPED_NOT_MARKED';
  }
  console.log('REAL_BUSINESS_E2E_EVIDENCE=' + JSON.stringify(evidence));
  if (evidence.cleanup.status !== 'CLEANUP_OK' && evidence.cleanup.status !== 'NOT_RUN') {
    console.log('::warning::R05_CLEANUP_STATUS=' + evidence.cleanup.status);
  }
  await browser.close();
}
