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
const jobId = required('E2E_FACTORY_JOB_ID');
const expectedStatus = required('E2E_EXPECTED_FACTORY_STATUS');
const backendPin = JSON.parse(
  readFileSync(new URL('../config/backend-runtime-truth.json', import.meta.url), 'utf8'),
);

const evidence = {
  frontendSha: process.env.E2E_FRONTEND_SHA ?? null,
  phase: 'initialization',
  previewOrigin: new URL(previewUrl).origin,
  backendOrigin: new URL(backendUrl).origin,
  sameOrigin: new URL(previewUrl).origin === new URL(backendUrl).origin,
  credentialsMode: 'include',
  login: { ok: false, finalUrl: null },
  cookie: { present: false, securityAttributesValid: false, sentToFactoryGet: false, metadata: [] },
  runtimeTruth: {
    attempted: false,
    url: `${backendUrl}/api/runtime-truth`,
    status: null,
    responseSeenByBrowser: false,
    expected: backendPin,
    actual: null,
  },
  get: {
    attempted: false,
    url: `${backendUrl}/api/orchestrator?jobId=${encodeURIComponent(jobId)}`,
    method: 'GET',
    status: null,
    redirected: false,
    preflight: false,
    responseSeenByBrowser: false,
  },
  browser: { requestFailed: null, consoleErrors: [] },
  ui: { factoryStatusRendered: false, status: null, expectedStatus, statusMatches: false },
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

page.on('console', (message) => {
  if (message.type() === 'error') evidence.browser.consoleErrors.push(message.text().slice(0, 500));
});

page.on('request', (request) => {
  if (request.method() === 'OPTIONS' && request.url().startsWith(backendUrl)) {
    evidence.get.preflight = true;
  }
});

page.on('requestfailed', (request) => {
  if (request.url() === evidence.get.url && request.method() === 'GET') {
    evidence.browser.requestFailed = request.failure()?.errorText ?? 'REQUEST_FAILED';
  }
});

try {
  evidence.phase = 'login-navigation';
  await page.goto(`${backendUrl}/api/auth/signin`, { waitUntil: 'networkidle', timeout: 30_000 });
  evidence.phase = 'login-form';
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  evidence.phase = 'login-submit';
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.locator('button[type="submit"]').click(),
  ]);

  evidence.phase = 'owner-session';
  await page.goto(backendUrl, { waitUntil: 'networkidle', timeout: 30_000 });
  evidence.login.finalUrl = page.url();
  evidence.login.ok = (await page.getByText('OWNER Session aktiv').count()) > 0;

  const cookies = await context.cookies(backendUrl);
  const sessionCookies = cookies.filter((cookie) => cookie.name.includes('next-auth.session-token'));
  evidence.cookie.present = sessionCookies.length > 0;
  evidence.cookie.metadata = sessionCookies.map(({ name, domain, path, secure, sameSite }) => ({
    name,
    domain,
    path,
    secure,
    sameSite,
  }));
  evidence.cookie.securityAttributesValid =
    sessionCookies.length > 0 &&
    sessionCookies.every((cookie) => cookie.secure === true && cookie.sameSite === 'None');

  if (!evidence.login.ok || !evidence.cookie.present) {
    throw new Error('AUTH_SESSION_NOT_ESTABLISHED');
  }

  evidence.phase = 'preview-navigation';
  await page.goto(previewUrl, { waitUntil: 'networkidle', timeout: 30_000 });

  evidence.phase = 'runtime-truth';
  evidence.runtimeTruth.attempted = true;
  const runtimeTruth = await page.evaluate(async (url) => {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    let body = null;
    try { body = await response.json(); } catch {}
    return { status: response.status, body };
  }, evidence.runtimeTruth.url);
  evidence.runtimeTruth.status = runtimeTruth.status;
  evidence.runtimeTruth.responseSeenByBrowser = true;
  evidence.runtimeTruth.actual = runtimeTruth.body;

  const runtimeTruthMatches =
    runtimeTruth.status === 200 &&
    runtimeTruth.body?.contractVersion === '1.0' &&
    runtimeTruth.body?.provider === 'render' &&
    runtimeTruth.body?.repository === backendPin.repository &&
    runtimeTruth.body?.branch === backendPin.branch &&
    runtimeTruth.body?.commitSha === backendPin.commitSha &&
    runtimeTruth.body?.serviceId === backendPin.serviceId;

  if (!runtimeTruthMatches) {
    throw new Error('BACKEND_RUNTIME_TRUTH_MISMATCH');
  }

  await page.evaluate(
    ({ key, value }) => sessionStorage.setItem(key, value),
    { key: 'craftflow.factory.activeJobId.v1', value: jobId },
  );

  const responsePromise = page.waitForResponse(
    (response) => response.url() === evidence.get.url && response.request().method() === 'GET',
    { timeout: 20_000 },
  ).catch(() => null);

  evidence.phase = 'factory-get';
  evidence.get.attempted = true;
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
  const response = await responsePromise;

  if (response) {
    evidence.get.responseSeenByBrowser = true;
    evidence.get.status = response.status();
    evidence.get.redirected = response.request().redirectedFrom() !== null;
    evidence.cookie.sentToFactoryGet = Boolean(await response.request().headerValue('cookie'));
  }

  evidence.phase = 'ui-status';
  const statusNode = page.locator('[data-testid="factory-status"]');
  try {
    await statusNode.waitFor({ state: 'visible', timeout: 10_000 });
    evidence.ui.factoryStatusRendered = true;
    evidence.ui.status = (await statusNode.textContent())?.trim() ?? null;
  } catch {
    evidence.ui.factoryStatusRendered = false;
  }

  evidence.phase = 'status-comparison';
  evidence.ui.statusMatches = evidence.ui.factoryStatusRendered &&
    typeof evidence.ui.status === 'string' && evidence.ui.status.length > 0 &&
    evidence.ui.status === evidence.ui.expectedStatus;

  console.log('REAL_E2E_EVIDENCE=' + JSON.stringify(evidence));

  const pass =
    evidence.login.ok &&
    evidence.cookie.present &&
    evidence.cookie.securityAttributesValid &&
    evidence.runtimeTruth.attempted &&
    evidence.runtimeTruth.status === 200 &&
    evidence.runtimeTruth.responseSeenByBrowser &&
    evidence.runtimeTruth.actual?.repository === backendPin.repository &&
    evidence.runtimeTruth.actual?.branch === backendPin.branch &&
    evidence.runtimeTruth.actual?.commitSha === backendPin.commitSha &&
    evidence.runtimeTruth.actual?.serviceId === backendPin.serviceId &&
    evidence.get.attempted &&
    evidence.get.status === 200 &&
    !evidence.get.redirected &&
    evidence.get.responseSeenByBrowser &&
    evidence.cookie.sentToFactoryGet &&
    evidence.browser.requestFailed === null &&
    evidence.ui.factoryStatusRendered && evidence.ui.statusMatches;

  if (!pass) throw new Error('REAL_E2E_FAIL');
  console.log('REAL_E2E_PASS');
} catch (error) {
  console.error('REAL_E2E_EVIDENCE=' + JSON.stringify(evidence));
  console.error('::error::' + (error instanceof Error ? error.message : 'REAL_E2E_FAIL'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
