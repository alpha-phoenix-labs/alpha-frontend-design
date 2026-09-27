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
const expectedFrontendSha = required('E2E_FRONTEND_SHA');

const prompt =
  'Create a minimal n8n workflow that receives a webhook POST with JSON and returns a JSON response containing ok=true. No external services, no credentials, no dynamic URLs.';

const evidence = {
  frontendSha: expectedFrontendSha,
  phase: 'initialization',
  jobId: null,
  backendStatus: null,
  uiStatus: null,
  approvalVersion: null,
  n8n: {
    result: null,
    executionId: null,
    importedId: null,
  },
  approval: {
    httpStatus: null,
    status: null,
  },
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

const nonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const driveArtifactId = (value) =>
  typeof value === 'string' && /^[a-zA-Z0-9_-]{6,}$/.test(value);

const fail = (message) => {
  throw new Error(message);
};

const jsonOf = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

try {
  evidence.phase = 'frontend-auth-gate';
  await page.goto(previewUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const loginButton = page.getByTestId('auth-login-button');
  await loginButton.waitFor({ state: 'visible', timeout: 20_000 });

  const workspace = page.getByPlaceholder('Describe the workflow you want Craftflow to build');
  if ((await workspace.count()) !== 0) {
    fail('PR15_AUTH_GATE_NOT_CLOSED');
  }

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

  evidence.phase = 'authenticated-workspace';
  await workspace.waitFor({ state: 'visible', timeout: 20_000 });

  evidence.phase = 'create-job-via-pr15-frontend';
  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.url() === `${backendUrl}/api/orchestrator` &&
      response.request().method() === 'POST',
    { timeout: 320_000 },
  );

  await workspace.fill(prompt);
  await workspace.press('Enter');

  const createResponse = await createResponsePromise;
  const created = await jsonOf(createResponse);
  if (!createResponse.ok() || typeof created?.jobId !== 'string') {
    fail(`PR15_CREATE_FAILED_HTTP_${createResponse.status()}`);
  }

  evidence.jobId = created.jobId;
  evidence.backendStatus = created.status ?? null;

  if (created.status !== 'WAITING_FOR_APPROVAL') {
    fail(`PR15_NOT_AT_APPROVAL:${created.status ?? 'UNKNOWN'}`);
  }

  evidence.phase = 'verify-real-n8n';
  if (
    created.testReport?.contractVersion !== '1.0' ||
    created.testReport?.jobId !== evidence.jobId ||
    created.testReport?.result !== 'PASS' ||
    !nonEmptyString(created.testReport?.executionId) ||
    !nonEmptyString(created.testReport?.importedId)
  ) {
    fail('PR15_N8N_PASS_NOT_PROVEN');
  }

  evidence.n8n.result = created.testReport.result;
  evidence.n8n.executionId = created.testReport.executionId;
  evidence.n8n.importedId = created.testReport.importedId;

  evidence.phase = 'approval-gate-visible';
  const statusNode = page.getByTestId('factory-status');
  await statusNode.waitFor({ state: 'visible', timeout: 20_000 });
  evidence.uiStatus = (await statusNode.textContent())?.trim() ?? null;
  if (evidence.uiStatus !== 'awaiting_human') {
    fail(`PR15_UI_STATUS_NOT_AWAITING_HUMAN:${evidence.uiStatus ?? 'MISSING'}`);
  }

  await page.getByText('Approval gate', { exact: true }).waitFor({
    state: 'visible',
    timeout: 20_000,
  });

  const versionNode = page.getByTestId('approval-version');
  await versionNode.waitFor({ state: 'visible', timeout: 20_000 });
  const versionText = (await versionNode.textContent())?.trim() ?? '';
  const versionMatch = versionText.match(/version\s+(\d+)/i);
  if (!versionMatch) {
    fail('PR15_APPROVAL_VERSION_MISSING');
  }
  evidence.approvalVersion = Number(versionMatch[1]);

  evidence.phase = 'human-approval-via-pr15-frontend';
  const approvalResponsePromise = page.waitForResponse(
    (response) =>
      response.url() === `${backendUrl}/api/orchestrator/approve` &&
      response.request().method() === 'POST',
    { timeout: 320_000 },
  );

  await page.getByRole('button', { name: 'Approve', exact: true }).click();

  const approvalResponse = await approvalResponsePromise;
  const approved = await jsonOf(approvalResponse);
  evidence.approval.httpStatus = approvalResponse.status();
  evidence.approval.status = approved?.status ?? null;

  if (!approvalResponse.ok()) {
    fail(`PR15_APPROVAL_HTTP_${approvalResponse.status()}`);
  }
  if (approved?.jobId !== evidence.jobId || approved?.status !== 'COMPLETED') {
    fail('PR15_APPROVAL_DID_NOT_COMPLETE');
  }

  evidence.phase = 'drive-complete';
  const archive = approved?.archive;
  evidence.drive.status = archive?.status ?? null;
  evidence.drive.auftragFileId = archive?.auftragFileId ?? null;
  evidence.drive.workflowFileId = archive?.workflowFileId ?? null;
  evidence.drive.testReportFileId = archive?.testReportFileId ?? null;
  evidence.drive.finalWorkflowFileId = archive?.finalWorkflowFileId ?? null;
  evidence.drive.documentationFileId = archive?.documentationFileId ?? null;

  if (
    archive?.status !== 'COMPLETE' ||
    !driveArtifactId(archive.auftragFileId) ||
    !driveArtifactId(archive.workflowFileId) ||
    !driveArtifactId(archive.testReportFileId) ||
    !driveArtifactId(archive.finalWorkflowFileId) ||
    !driveArtifactId(archive.documentationFileId)
  ) {
    fail('PR15_DRIVE_NOT_COMPLETE');
  }

  evidence.phase = 'drive-persistence-readback';
  const readback = await page.evaluate(
    async ({ url, jobId }) => {
      const response = await fetch(`${url}/api/orchestrator/archive`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });
      let body = null;
      try {
        body = await response.json();
      } catch {}
      return { status: response.status, body };
    },
    { url: backendUrl, jobId: evidence.jobId },
  );

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
    fail('PR15_DRIVE_PERSISTENCE_MISMATCH');
  }

  evidence.drive.persistedReportMatches = true;
  evidence.phase = 'final-drive-proven';

  console.log('PR15_FULL_DRIVE_E2E_EVIDENCE=' + JSON.stringify(evidence));
  console.log('PR15_FULL_DRIVE_E2E_PASS');
} catch (error) {
  console.error('PR15_FULL_DRIVE_E2E_EVIDENCE=' + JSON.stringify(evidence));
  console.error('::error::' + (error instanceof Error ? error.message : 'PR15_FULL_DRIVE_E2E_FAIL'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
