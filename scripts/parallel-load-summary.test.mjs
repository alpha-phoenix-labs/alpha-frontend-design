import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarize, parseRunLog} from './parallel-load-summary.mjs';

const workflow = readFileSync(new URL('../.github/workflows/parallel-load-e2e.yml', import.meta.url), 'utf8');
const promotion = readFileSync(new URL('../.github/workflows/production-promotion.yml', import.meta.url), 'utf8');

function evidence(i, overrides = {}) {
  return {
    correlationId: `craftflow-load-1-1-n3-${i}`,
    phase: 'final',
    jobId: `job-${i}`,
    n8n: {pass: true, executionId: String(100 + i), importedId: `wf-${i}`},
    runtimeTruth: {matches: true},
    cleanup: {status: 'CLEANUP_OK'},
    ...overrides,
  };
}
function log(e, {pass = true, error = null} = {}) {
  return [
    'REAL_BUSINESS_E2E_EVIDENCE=' + JSON.stringify({...e, cleanup: {status: 'NOT_RUN'}}),
    pass ? 'REAL_E2E_PASS' : '',
    error ? '::error::' + error : '',
    'REAL_BUSINESS_E2E_EVIDENCE=' + JSON.stringify(e),
  ].join('\n');
}
const runs = (n, mutate = () => ({})) => Array.from({length: n}, (_, k) => {
  const i = k + 1;
  const {evidence: e = evidence(i), exitCode = 0, pass = true, error = null, durationMs = 30_000 + i} = mutate(i);
  return {index: i, exitCode, durationMs, log: log(e, {pass, error})};
});

test('parseRunLog takes the final evidence line (after cleanup) and the last error', () => {
  const parsed = parseRunLog(log(evidence(1), {pass: false, error: 'BUSINESS_E2E_CREATE_FAILED'}));
  assert.equal(parsed.evidence.cleanup.status, 'CLEANUP_OK');
  assert.equal(parsed.passed, false);
  assert.equal(parsed.error, 'BUSINESS_E2E_CREATE_FAILED');
});

test('all parallel runs passing with distinct jobs and clean residue is PASS with metrics', () => {
  const s = summarize({parallel: 3, runs: runs(3), startSkewMs: 120});
  assert.equal(s.status, 'PASS');
  assert.deepEqual(s.metrics.durationMs, {min: 30001, p50: 30002, p95: 30003, max: 30003});
  assert.equal(s.metrics.errorRate, 0);
  assert.equal(s.metrics.startSkewMs, 120);
  assert.ok(Object.values(s.checks).every(Boolean));
});

for (const [name, mutate, check] of [
  ['one failed run', i => (i === 2 ? {exitCode: 1, pass: false, error: 'BUSINESS_E2E_CREATE_FAILED', evidence: evidence(2, {phase: 'create-job-via-frontend'})} : {}), 'allPass'],
  ['duplicate jobId (double processing)', i => (i === 3 ? {evidence: evidence(3, {jobId: 'job-1'})} : {}), 'distinctJobIds'],
  ['duplicate n8n execution', i => (i === 3 ? {evidence: evidence(3, {n8n: {executionId: '101'}})} : {}), 'distinctN8nExecutions'],
  ['runtime pin mismatch', i => (i === 1 ? {evidence: evidence(1, {runtimeTruth: {matches: false}})} : {}), 'allRuntimeTruthMatch'],
  ['missing evidence', i => (i === 1 ? {evidence: {}} : {}), 'distinctJobIds'],
]) {
  test(`${name} makes the load verdict FAIL`, () => {
    const s = summarize({parallel: 3, runs: runs(3, mutate)});
    assert.equal(s.status, 'FAIL');
    assert.equal(s.checks[check], false);
  });
}

test('parallel bound and run count fail closed', () => {
  assert.throws(() => summarize({parallel: 4, runs: runs(4)}), /PARALLEL_NOT_ALLOWED/);
  assert.throws(() => summarize({parallel: 5, runs: runs(3)}), /RUN_COUNT_MISMATCH/);
});

test('load workflow is manual-only, main-only, confirmed and bounded', () => {
  const triggers = workflow.slice(workflow.indexOf('\non:'), workflow.indexOf('\npermissions:'));
  assert.match(triggers, /workflow_dispatch:/);
  assert.doesNotMatch(triggers, /\n  (push|pull_request|workflow_run|schedule):/);
  assert.match(workflow, /if: \$\{\{ github\.ref == 'refs\/heads\/main' && inputs\.confirm == 'R-07d' \}\}/);
  assert.match(workflow, /options:\n\s+- '3'\n\s+- '5'\n/);
  assert.match(workflow, /case "\$PARALLEL" in 3\|5\)/);
});

test('load workflow never builds, uploads or deploys and cannot trigger promotion', () => {
  assert.doesNotMatch(workflow, /wrangler|versions (upload|deploy)|npm run build|cloudflare\/wrangler-action/);
  assert.match(workflow, /^name: R-07 Parallel Load E2E$/m);
  assert.doesNotMatch(workflow, /^name: Real E2E$/m);
  assert.match(promotion, /workflows:\s*\n\s*- Real E2E\s*\n/);
  assert.doesNotMatch(promotion, /R-07 Parallel Load E2E/);
});

test('every parallel job is test-marked and cleaned via its own correlationId', () => {
  assert.match(workflow, /cid="craftflow-load-\$\{GITHUB_RUN_ID\}-\$\{GITHUB_RUN_ATTEMPT\}-n\$\{PARALLEL\}-\$\{i\}"/);
  assert.match(workflow, /CORRELATION_ID="\$cid"/);
  assert.match(workflow, /node scripts\/real-business-e2e\.mjs/);
  assert.doesNotMatch(workflow, /E2E_KEEP_ARTIFACTS/);
});
