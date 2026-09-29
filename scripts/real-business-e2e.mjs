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

const evidence = {
  frontendSha: process.env.E2E_FRONTEND_SHA ?? null,
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
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const fail = (message) => { throw new Error(message); };
const jsonOf = async (response) => {
  try { return await response.json(); } catch { return null; }
};
const nonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const driveArtifactId = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{6,}$/.test(value);

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

  evidence.phase = 'create-job-via-frontend';
  const createResponsePromise = page.waitForResponse(
    (response) => response.url() === `${backendUrl}/api/orchestrator` &&
      response.request().method() === 'POST',
    { timeout: 320_000 },
  );
  await workspace.fill(prompt);
  await workspace.press('Enter');
  const createResponse = await createResponsePromise;
  const created = await jsonOf(createResponse);
  if (!createResponse.ok() || typeof created?.jobId !== 'string') fail('BUSINESS_E2E_CREATE_FAILED');
  evidence.jobId = created.jobId;
  evidence.submittedStatus = created.status ?? null;

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
  await page.getByRole('button', { name: 'Approve' }).click();
  const approvalResponse = await approvalResponsePromise;
  const approved = await jsonOf(approvalResponse);
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
  await browser.close();
}
