import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../.github/workflows/real-e2e.yml', import.meta.url), 'utf8');
const smoke = readFileSync(new URL('./real-e2e-smoke.mjs', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const backendPin = JSON.parse(readFileSync(new URL('../config/backend-runtime-truth.json', import.meta.url), 'utf8'));
const unavailableNegative = readFileSync(new URL('./real-e2e-backend-unavailable-negative.mjs', import.meta.url), 'utf8');

test('real E2E runs automatically for PR and main push', () => {
  assert.match(source, /\n  pull_request:\n    branches:\n      - main\n/);
  assert.match(source, /\n  push:\n    branches:\n      - main\n/);
});

test('real E2E is forced into HTTP mode against the frozen backend origin', () => {
  assert.match(source, /VITE_FACTORY_MODE: http/);
  assert.match(source, /VITE_FACTORY_API_BASE_URL: https:\/\/n8n-workflow-factory\.onrender\.com/);
});

test('real E2E requires explicit browser credentials and never embeds them', () => {
  assert.match(source, /secrets\.E2E_OWNER_EMAIL/);
  assert.match(source, /secrets\.E2E_OWNER_PASSWORD/);
  assert.doesNotMatch(source, /continue-on-error:\s*true/);
});

test('production HTTP mode is fail-closed behind an OWNER auth gate', () => {
  assert.match(app, /factoryMode === "http" \? <AuthGate \/> : <AuthenticatedCraftflow \/>/);
  assert.match(app, /\/api\/runtime-truth/);
  assert.match(app, /credentials: "include"/);
  assert.match(app, /response\.status === 401/);
  assert.match(app, /data-testid="auth-login-link"/);
  assert.match(app, /data-testid="auth-gate-unavailable"/);
});

test('real E2E starts unauthenticated at the frontend before login', () => {
  const gate = smoke.indexOf("phase = 'unauthenticated-preview'");
  const login = smoke.indexOf("phase = 'login-navigation'");
  assert.ok(gate >= 0 && login > gate, 'frontend auth gate must execute before backend login');
  assert.match(smoke, /AUTH_GATE_NOT_ENFORCED/);
  assert.match(smoke, /unauthenticatedProbeStatus !== 401/);
  assert.match(smoke, /unauthenticatedMutationStatus !== 401/);
  assert.match(smoke, /workspaceVisibleBeforeLogin/);
  assert.match(smoke, /workspaceVisibleAfterLogin/);
  assert.match(smoke, /auth-login-link/);
});

test('real E2E uses no-traffic version upload and contains no production deploy command', () => {
  assert.match(source, /command: versions upload/);
  assert.doesNotMatch(source, /command: deploy/);
});

test('smoke test allows exactly one unauthenticated no-op POST boundary probe', () => {
  assert.match(smoke, /craftflow\.factory\.activeJobId\.v1/);
  assert.match(smoke, /method\(\) === 'GET'/);
  assert.equal((smoke.match(/method:\s*['"]POST['"]/g) ?? []).length, 1);
  assert.match(smoke, /body: JSON\.stringify\(\{\}\)/);
  assert.match(smoke, /unauthenticatedMutationStatus !== 401/);
  assert.doesNotMatch(smoke, /body: JSON\.stringify\(\{\s*prompt:/);
  assert.match(smoke, /\[data-testid="factory-status"\]/);
});

test('real E2E is pinned to the expected backend main and Render service identity', () => {
  assert.deepEqual(backendPin, {
    repository: 'alpha-phoenix-labs/n8n-workflow-factory',
    branch: 'main',
    commitSha: '43ef17acf0cd60aa8cd894139cae6489cf7f32bd',
    serviceId: 'srv-daqk0sp7lnhs73d9nr7g',
  });
  assert.match(smoke, /\/api\/runtime-truth/);
  assert.match(smoke, /BACKEND_RUNTIME_TRUTH_MISMATCH/);
  assert.match(smoke, /runtimeTruth\.body\?\.commitSha === backendPin\.commitSha/);
  assert.match(smoke, /runtimeTruth\.body\?\.serviceId === backendPin\.serviceId/);
});

test('smoke evidence never logs cookie values', () => {
  assert.match(smoke, /\{ name, domain, path, secure, sameSite \}/);
  assert.doesNotMatch(smoke, /cookie\.value/);
});

test('real E2E workflow proves unavailable backend locks the actual frontend UI', () => {
  assert.match(source, /Prove unavailable backend fails closed/);
  assert.match(source, /id: backend_unavailable/);
  assert.match(source, /node scripts\/real-e2e-backend-unavailable-negative\.mjs/);
  assert.match(unavailableNegative, /VITE_FACTORY_API_BASE_URL: unavailableBackendUrl/);
  assert.match(unavailableNegative, /auth-gate-unavailable/);
  assert.match(unavailableNegative, /BACKEND_UNAVAILABLE_DID_NOT_FAIL_CLOSED/);
  assert.match(unavailableNegative, /BACKEND_UNAVAILABLE_NEGATIVE_PASS/);
  assert.doesNotMatch(unavailableNegative, /real-e2e-smoke\.mjs/);
});

test('UI status gate rejects invisible, missing, empty and non-exact status', () => {
  const expression = smoke.match(/evidence\.ui\.statusMatches = ([\s\S]*?);/)[1];
  const matches = new Function('evidence', 'return ' + expression);
  const ui = { factoryStatusRendered: true, status: 'completed', expectedStatus: 'completed' };
  assert.equal(matches({ ui }), true);
  for (const change of [
    { factoryStatusRendered: false }, { status: null }, { status: '' },
    { expectedStatus: undefined }, { expectedStatus: '' }, { expectedStatus: 'failed' },
    { status: 'completed extra' }, { status: 'Completed' },
  ]) assert.equal(matches({ ui: { ...ui, ...change } }), false);
  assert.ok(smoke.includes("required('E2E_EXPECTED_FACTORY_STATUS')"));
  assert.ok(smoke.includes('evidence.ui.factoryStatusRendered && evidence.ui.statusMatches;'));
  assert.match(source, /E2E_EXPECTED_FACTORY_STATUS: completed/);
  assert.match(source, /node scripts\/real-e2e-status-mismatch-negative\.mjs/);
});


test('cookie security attributes are a hard fail-closed gate', () => {
  const expression = smoke.match(/evidence\.cookie\.securityAttributesValid\s*=\s*([\s\S]*?);/)[1];
  const cookieSecurityPass = new Function('sessionCookies', 'return ' + expression);
  assert.equal(cookieSecurityPass([{ secure: true, sameSite: 'None' }]), true);
  for (const cookies of [
    [],
    [{ secure: false, sameSite: 'None' }],
    [{ secure: true, sameSite: 'Lax' }],
    [{ secure: true, sameSite: 'Strict' }],
    [{ secure: true, sameSite: undefined }],
    [{ secure: true, sameSite: 'None' }, { secure: false, sameSite: 'None' }],
  ]) assert.equal(cookieSecurityPass(cookies), false);
  assert.ok(smoke.includes('evidence.cookie.securityAttributesValid &&'));
});


test('real E2E has an always-running final security gate that rejects skipped steps', () => {
  assert.match(source, /id: backend_unavailable/);
  assert.match(source, /id: status_mismatch/);
  assert.match(source, /id: real_browser/);
  assert.match(source, /name: Enforce every E2E security gate/);
  assert.match(source, /if: \$\{\{ always\(\) && !cancelled\(\) \}\}/);
  assert.match(source, /BACKEND_UNAVAILABLE_OUTCOME/);
  assert.match(source, /STATUS_MISMATCH_OUTCOME/);
  assert.match(source, /REAL_BROWSER_OUTCOME/);
  assert.match(source, /SYSTEM_E2E_SECURITY_GATE=PASS/);
});
