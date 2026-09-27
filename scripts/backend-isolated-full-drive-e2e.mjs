import { chromium } from 'playwright';

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`MISSING_REQUIRED_ENV:${name}`);
  return value;
};

const backendUrl = required('E2E_BACKEND_URL').replace(/\/+$/, '');
const email = required('E2E_OWNER_EMAIL');
const password = required('E2E_OWNER_PASSWORD');

const prompt =
  'Create a minimal n8n workflow that receives a webhook POST with JSON and returns a JSON response containing ok=true. No external services, no credentials, no dynamic URLs.';

const evidence = {
  phase: 'initialization',
  backendUrl,
  browserPageUrl: null,
  browserOrigin: null,
  createFailureText: null,
  jobId: null,
  createdStatus: null,
  snapshotStatus: null,
  approvalVersion: null,
  n8n: { result: null, executionId: null, importedId: null },
  approvedStatus: null,
  drive: {
    status: null,
    auftragFileId: null,
    workflowFileId: null,
    testReportFileId: null,
    finalWorkflowFileId: null,
    documentationFileId: null,
    persistedReportMatches: false,
  },
};

const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const driveId = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{6,}$/.test(value);
const fail = (message) => { throw new Error(message); };

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const api = async (path, init = {}) =>
  page.evaluate(async ({ url, path, init }) => {
    const response = await fetch(url + path, {
      credentials: 'include',
      cache: 'no-store',
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
    });
    const text = await response.text();
    let body = null;
    try { body = JSON.parse(text); } catch {}
    return { status: response.status, ok: response.ok, body, text };
  }, { url: backendUrl, path, init });

try {
  evidence.phase = 'owner-login';
  await page.goto(`${backendUrl}/api/auth/signin`, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.locator('button[type="submit"]').click(),
  ]);

  evidence.browserPageUrl = page.url();
  evidence.browserOrigin = await page.evaluate(() => location.origin);

  evidence.phase = 'runtime-truth';
  const truth = await api('/api/runtime-truth');
  if (truth.status !== 200) fail(`BACKEND_AUTH_NOT_PROVEN:${truth.status}`);

  evidence.phase = 'create-job';
  const created = await api('/api/orchestrator', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  if (!created.ok || typeof created.body?.jobId !== 'string') {
    evidence.createFailureText = created.text ?? null;
    fail(`BACKEND_CREATE_FAILED:${created.status}:${created.text ?? 'NO_BODY'}`);
  }

  evidence.jobId = created.body.jobId;
  evidence.createdStatus = created.body.status ?? null;

  evidence.phase = 'snapshot-after-create';
  const snapshot = await api(`/api/orchestrator?jobId=${encodeURIComponent(evidence.jobId)}`);
  if (!snapshot.ok) fail(`BACKEND_SNAPSHOT_FAILED:${snapshot.status}`);

  evidence.snapshotStatus = snapshot.body?.status ?? null;
  evidence.approvalVersion = snapshot.body?.version ?? null;

  if (snapshot.body?.status !== 'WAITING_FOR_APPROVAL') {
    fail(`BACKEND_NOT_WAITING_FOR_APPROVAL:${snapshot.body?.status ?? 'UNKNOWN'}`);
  }
  if (!Number.isInteger(snapshot.body?.version)) {
    fail('BACKEND_APPROVAL_VERSION_MISSING');
  }

  const report = snapshot.body?.testReport;
  if (
    report?.contractVersion !== '1.0' ||
    report?.jobId !== evidence.jobId ||
    report?.result !== 'PASS' ||
    !nonEmpty(report?.executionId) ||
    !nonEmpty(report?.importedId)
  ) {
    fail('BACKEND_N8N_PASS_NOT_PROVEN');
  }

  evidence.n8n.result = report.result;
  evidence.n8n.executionId = report.executionId;
  evidence.n8n.importedId = report.importedId;

  evidence.phase = 'approve';
  const approved = await api('/api/orchestrator/approve', {
    method: 'POST',
    body: JSON.stringify({
      jobId: evidence.jobId,
      version: evidence.approvalVersion,
      approve: true,
    }),
  });

  if (!approved.ok) fail(`BACKEND_APPROVAL_FAILED:${approved.status}`);
  evidence.approvedStatus = approved.body?.status ?? null;

  if (approved.body?.jobId !== evidence.jobId || approved.body?.status !== 'COMPLETED') {
    fail('BACKEND_NOT_COMPLETED');
  }

  evidence.phase = 'drive-complete';
  const archive = approved.body?.archive;
  if (
    archive?.status !== 'COMPLETE' ||
    !driveId(archive?.auftragFileId) ||
    !driveId(archive?.workflowFileId) ||
    !driveId(archive?.testReportFileId) ||
    !driveId(archive?.finalWorkflowFileId) ||
    !driveId(archive?.documentationFileId)
  ) {
    evidence.drive.status = archive?.status ?? null;
    fail('BACKEND_DRIVE_NOT_COMPLETE');
  }

  evidence.drive.status = archive.status;
  evidence.drive.auftragFileId = archive.auftragFileId;
  evidence.drive.workflowFileId = archive.workflowFileId;
  evidence.drive.testReportFileId = archive.testReportFileId;
  evidence.drive.finalWorkflowFileId = archive.finalWorkflowFileId;
  evidence.drive.documentationFileId = archive.documentationFileId;

  evidence.phase = 'drive-readback';
  const readback = await api('/api/orchestrator/archive', {
    method: 'POST',
    body: JSON.stringify({ jobId: evidence.jobId }),
  });

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
    fail('BACKEND_DRIVE_READBACK_MISMATCH');
  }

  evidence.drive.persistedReportMatches = true;
  evidence.phase = 'final';
  console.log('BACKEND_ISOLATED_E2E_EVIDENCE=' + JSON.stringify(evidence));
  console.log('BACKEND_ISOLATED_FULL_DRIVE_PASS');
} catch (error) {
  console.error('BACKEND_ISOLATED_E2E_EVIDENCE=' + JSON.stringify(evidence));
  console.error('::error::' + (error instanceof Error ? error.message : 'BACKEND_ISOLATED_E2E_FAIL'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
