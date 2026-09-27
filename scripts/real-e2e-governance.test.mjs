import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/real-e2e.yml', import.meta.url), 'utf8');
const business = readFileSync(new URL('./real-business-e2e.mjs', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('PR validation and main business E2E are distinct', () => {
  assert.match(workflow, /real-e2e-contract:/);
  assert.match(workflow, /if: \$\{\{ github\.event_name == 'pull_request' \}\}/);
  assert.match(workflow, /real-e2e:/);
  assert.match(workflow, /github\.event_name == 'push'/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
});

test('main real-e2e runs the full business script only after a real preview build', () => {
  assert.match(workflow, /command: versions upload/);
  assert.match(workflow, /Run full real business E2E through Google Drive COMPLETE/);
  assert.match(workflow, /node scripts\/real-business-e2e\.mjs/);
  assert.doesNotMatch(workflow, /command: deploy\b/);
});

test('full business E2E starts at frontend OWNER auth and submits a new prompt through UI', () => {
  assert.match(business, /auth-login-button/);
  assert.match(business, /input\[name="email"\]/);
  assert.match(business, /input\[name="password"\]/);
  assert.match(business, /Describe the workflow you want Craftflow to build/);
  assert.match(business, /workspace\.fill\(prompt\)/);
  assert.match(business, /workspace\.press\('Enter'\)/);
  assert.match(business, /createResponsePromise/);
});

test('full business E2E requires real n8n execution before approval', () => {
  assert.match(business, /created\.status !== 'WAITING_FOR_APPROVAL'/);
  assert.match(business, /testReport\?\.contractVersion !== '1\.0'/);
  assert.match(business, /testReport\?\.jobId !== evidence\.jobId/);
  assert.match(business, /testReport\?\.result !== 'PASS'/);
  assert.match(business, /nonEmptyString\(created\.testReport\?\.executionId\)/);
  assert.match(business, /nonEmptyString\(created\.testReport\?\.importedId\)/);
  assert.match(business, /BUSINESS_E2E_N8N_TEST_NOT_PROVEN/);
});

test('n8n IDs follow the public contract while Drive artifact IDs remain strict', () => {
  assert.match(business, /const nonEmptyString = \(value\) => typeof value === 'string' && value\.trim\(\)\.length > 0/);
  assert.match(business, /const driveArtifactId = \(value\) => typeof value === 'string' && \/\^\[a-zA-Z0-9_-\]\{6,\}\$\//);
  assert.match(business, /driveArtifactId\(archive\.finalWorkflowFileId\)/);
});

test('full business E2E performs approval through the rendered frontend', () => {
  assert.match(business, /factory-status/);
  assert.match(business, /awaiting_human/);
  assert.match(business, /approval-version/);
  assert.match(business, /getByRole\('button', \{ name: 'Approve' \}\)\.click\(\)/);
  assert.match(business, /\/api\/orchestrator\/approve/);
});

test('REAL_E2E_PASS is impossible without COMPLETED plus Google Drive COMPLETE', () => {
  const passIndex = business.indexOf("console.log('REAL_E2E_PASS')");
  assert.ok(passIndex > 0);
  for (const required of [
    "approved?.status !== 'COMPLETED'",
    "archive?.status !== 'COMPLETE'",
    'archive.auftragFileId',
    'archive.workflowFileId',
    'archive.testReportFileId',
    'archive.finalWorkflowFileId',
    'archive.documentationFileId',
    'BUSINESS_E2E_DRIVE_PERSISTENCE_MISMATCH',
  ]) {
    const index = business.indexOf(required);
    assert.ok(index >= 0 && index < passIndex, required + ' must gate REAL_E2E_PASS');
  }
});

test('Drive completion is read back idempotently from backend persistence', () => {
  assert.match(business, /\/api\/orchestrator\/archive/);
  assert.match(business, /persisted\?\.status !== 'COMPLETE'/);
  assert.match(business, /persistedReportMatches = true/);
});

test('frontend remains fail-closed behind OWNER session gate', () => {
  assert.match(app, /factoryMode === "http" \? <AuthGate \/> : <AuthenticatedCraftflow \/>/);
  assert.match(app, /\/api\/runtime-truth/);
  assert.match(app, /credentials: "include"/);
  assert.match(app, /data-testid="auth-login-button"/);
  assert.match(app, /data-testid="auth-gate-unavailable"/);
});

test('business E2E never embeds credentials or Drive secrets', () => {
  assert.doesNotMatch(business, /GDRIVE_|GOOGLE_DRIVE_|refresh[_-]?token|client[_-]?secret/i);
  assert.match(workflow, /secrets\.E2E_OWNER_EMAIL/);
  assert.match(workflow, /secrets\.E2E_OWNER_PASSWORD/);
  assert.doesNotMatch(workflow, /continue-on-error:\s*true/);
});
