import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../.github/workflows/real-e2e.yml', import.meta.url), 'utf8');
const smoke = readFileSync(new URL('./real-e2e-smoke.mjs', import.meta.url), 'utf8');
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

test('real E2E uses no-traffic version upload and contains no production deploy command', () => {
  assert.match(source, /command: versions upload/);
  assert.doesNotMatch(source, /command: deploy/);
});

test('smoke test is read-only and exercises the application recovery path', () => {
  assert.match(smoke, /craftflow\.factory\.activeJobId\.v1/);
  assert.match(smoke, /method\(\) === 'GET'/);
  assert.doesNotMatch(smoke, /method:\s*['"]POST['"]/);
  assert.doesNotMatch(smoke, /fetch\([^)]*orchestrator/);
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

test('real E2E workflow proves unavailable backend produces visible failure', () => {
  assert.match(source, /Prove unavailable backend fails closed/);
  assert.match(source, /node scripts\/real-e2e-backend-unavailable-negative\.mjs/);
  assert.match(unavailableNegative, /reserveAndReleasePort/);
  assert.match(unavailableNegative, /outcome\.code !== 0/);
  assert.match(unavailableNegative, /REAL_E2E_EVIDENCE=/);
  assert.match(unavailableNegative, /::error::/);
  assert.match(unavailableNegative, /!combined\.includes\('REAL_E2E_PASS'\)/);
  assert.match(unavailableNegative, /BACKEND_UNAVAILABLE_NEGATIVE_PASS/);
});
