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

test('main push ignores only release evidence paths while PR trigger stays unfiltered', () => {
  const trigger = workflow.split('\npermissions:')[0];
  const prBlock = trigger.match(/\n  pull_request:\n([\s\S]*?)\n  push:/)?.[1] ?? '';
  const pushBlock = trigger.match(/\n  push:\n([\s\S]*?)\n  workflow_dispatch:/)?.[1] ?? '';
  assert.doesNotMatch(prBlock, /paths-ignore:/, 'pull-request trigger must remain unfiltered');
  assert.match(pushBlock, /paths-ignore:/, 'main push must declare paths-ignore');
  const ignored = pushBlock
    .split('paths-ignore:\n')[1]
    .split('\n')
    .filter((line) => /^\s+- /.test(line))
    .map((line) => line.trim().slice(2));
  assert.deepEqual(ignored, ['evidence/**', 'release/**']);
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
  assert.match(business, /WAITING_FOR_APPROVAL/);
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

test('R-05 marks the created job as test job and cleans up only after the PASS decision', () => {
  const createIndex = business.indexOf('evidence.jobId = created.jobId;');
  const markIndex = business.indexOf("evidence.phase = 'test-mark';\n  await markTestJob();");
  const passIndex = business.indexOf("console.log('REAL_E2E_PASS')");
  const finallyIndex = business.lastIndexOf('} finally {');
  const cleanupIndex = business.indexOf("backendPost('/api/orchestrator/test-cleanup'");
  assert.ok(createIndex > 0 && markIndex > createIndex, 'test-mark must follow job creation');
  // R-08: the shared helper posts to test-mark and is used in recovery only after the jobId is known.
  const helper = business.slice(business.indexOf('const markTestJob = async () => {'), business.indexOf('const recoverAfterCreateTimeout'));
  assert.match(helper, /backendPost\('\/api\/orchestrator\/test-mark', \{ jobId: evidence\.jobId, correlationId \}\)/);
  const recovery = business.slice(business.indexOf('const recoverAfterCreateTimeout'), business.indexOf('const backendPost ='));
  assert.ok(recovery.indexOf('evidence.jobId = found.body.jobId;') > 0 && recovery.indexOf('await markTestJob();') > recovery.indexOf('evidence.jobId = found.body.jobId;'), 'recovery marks only a known job');
  assert.ok(passIndex > 0 && finallyIndex > passIndex && cleanupIndex > finallyIndex, 'cleanup must run in finally, after PASS/FAIL');
  assert.match(business, /jobId: evidence\.jobId, correlationId \}/);
  assert.match(business, /credentials: 'include'/);
});

test('R-05 cleanup never changes the E2E verdict and is reported as own status', () => {
  const finallyBlock = business.slice(business.lastIndexOf('} finally {'));
  assert.doesNotMatch(finallyBlock, /process\.exitCode/);
  assert.doesNotMatch(finallyBlock, /REAL_E2E_PASS/);
  assert.match(finallyBlock, /evidence\.cleanup\.marked && !keepArtifacts/);
  assert.match(finallyBlock, /CLEANUP_SKIPPED_EVIDENCE/);
  assert.match(finallyBlock, /CLEANUP_SKIPPED_NOT_MARKED/);
  assert.match(finallyBlock, /console\.log\('REAL_BUSINESS_E2E_EVIDENCE=' \+ JSON\.stringify\(evidence\)\)/);
});

test('R-06 business E2E binds to the pinned backend runtime before creating a job', () => {
  assert.match(business, /config\/backend-runtime-truth\.json/);
  assert.match(business, /\/api\/runtime-truth/);
  for (const field of ['repository', 'branch', 'commitSha', 'serviceId']) {
    assert.match(business, new RegExp(`'${field}'`));
  }
  assert.match(business, /BUSINESS_E2E_RUNTIME_TRUTH_MISMATCH/);
  assert.match(business, /BUSINESS_E2E_RUNTIME_TRUTH_UNAVAILABLE/);
  const runtimeCheck = business.indexOf("evidence.phase = 'runtime-truth'");
  const createJob = business.indexOf("evidence.phase = 'create-job-via-frontend'");
  assert.ok(runtimeCheck > 0 && runtimeCheck < createJob, 'runtime truth must be verified before any job is created');
});
