import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {STAGES, largeWorkflowPrompt} from './large-workflow-prompts.mjs';
import {summarizeStage} from './large-workflow-summary.mjs';

const workflow = readFileSync(new URL('../.github/workflows/large-workflow-e2e.yml', import.meta.url), 'utf8');
const promotion = readFileSync(new URL('../.github/workflows/production-promotion.yml', import.meta.url), 'utf8');
const business = readFileSync(new URL('./real-business-e2e.mjs', import.meta.url), 'utf8');

test('stages follow the binding order 20 → 40 → 60 → 80 → 100', () => {
  assert.deepEqual([...STAGES], [20, 40, 60, 80, 100]);
});

test('each stage prompt is realistic, names its branch flow and target node count and fits the backend limit', () => {
  const flows = {
    20: ['Friseur', 'Online-Termin', 'Bewertungsanfrage'],
    40: ['Gastronomie', 'Tischprüfung', 'Tagesübersicht'],
    60: ['SHK', 'Dringlichkeit', 'Nachfassen'],
    80: ['Dachdecker', 'Kalkulation', 'Bewertung'],
    100: ['Spedition', 'POD', 'Reporting'],
  };
  for (const stage of STAGES) {
    const text = largeWorkflowPrompt(stage, `craftflow-large-1-1-n${stage}`);
    assert.match(text, new RegExp(`genau ${stage} Nodes`));
    assert.match(text, new RegExp(`^Correlation ID craftflow-large-1-1-n${stage}\\.`));
    for (const word of flows[stage]) assert.ok(text.includes(word), `${stage}: ${word}`);
    assert.match(text, /Keine Zugangsdaten/);
    assert.ok(text.length <= 8000, `${stage}: ${text.length}`);
  }
  assert.throws(() => largeWorkflowPrompt(30, 'x'), /STAGE_NOT_ALLOWED/);
  assert.throws(() => largeWorkflowPrompt(20, 'bad id'), /INVALID_CORRELATION_ID/);
});

const evidence = (overrides = {}) => ({
  correlationId: 'craftflow-large-1-1-n20', phase: 'final', jobId: 'job-20', submittedStatus: 'WAITING_FOR_APPROVAL',
  promptChars: 1500, createErrorMessage: null, timingMs: {create: 61000, approve: 9000, total: 90000},
  runtimeTruth: {matches: true}, n8n: {executionId: '50', importedId: 'wf'}, drive: {status: 'COMPLETE'},
  cleanup: {status: 'CLEANUP_OK'},
  runMetrics: {
    create: {nodeCount: 20, connectionCount: 19, workflowBytes: 9000, testReportBytes: 120, builderRetries: 1, stepRuns: {BUILDER: 1},
      phaseMs: {BOSS: 900, ARCHITECT: 4000, BUILDER: 40000, SECURITY: 2, TESTER: 6000}, testerMs: {importMs: 800, activateMs: 600, webhookMs: 3000, executionReadMs: 300}},
    approve: {nodeCount: 20, connectionCount: 19, workflowBytes: 9000, testReportBytes: 120, documentationBytes: 700, phaseMs: {DOCS: 3}},
  },
  ...overrides,
});
const log = (e, pass = true) => ['REAL_BUSINESS_E2E_EVIDENCE=' + JSON.stringify(e), pass ? 'REAL_E2E_PASS' : '::error::BUSINESS_E2E_NOT_AT_APPROVAL:FAILED'].join('\n');

test('a passing stage reports every mandatory field', () => {
  const s = summarizeStage({stage: 20, exitCode: 0, log: log(evidence())});
  assert.equal(s.status, 'PASS');
  assert.equal(s.nodeCount, 20);
  assert.equal(s.jobId, 'job-20');
  assert.equal(s.correlationId, 'craftflow-large-1-1-n20');
  assert.equal(s.durationsMs.builder, 40000);
  assert.equal(s.durationsMs.n8nImport, 800);
  assert.equal(s.durationsMs.n8nWebhookExecution, 3000);
  assert.equal(s.builderRetries, 1);
  assert.equal(s.sizesBytes.workflow, 9000);
  assert.equal(s.sizesBytes.documentation, 700);
  assert.equal(s.cleanup, 'CLEANUP_OK');
});

test('fewer nodes than the stage target, a failed run or missing cleanup are FAIL', () => {
  const tooSmall = evidence();
  tooSmall.runMetrics.approve.nodeCount = 12;
  assert.equal(summarizeStage({stage: 20, exitCode: 0, log: log(tooSmall)}).checks.nodeCountReached, false);
  const failed = summarizeStage({stage: 40, exitCode: 1, log: log(evidence({phase: 'create-job-via-frontend', submittedStatus: 'FAILED', createErrorMessage: 'INVALID_WORKFLOW', runMetrics: {create: {nodeCount: 31, phaseMs: {BUILDER: 50000}}, approve: null}}), false)});
  assert.equal(failed.status, 'FAIL');
  assert.equal(failed.failedPhase, 'create-job-via-frontend');
  assert.equal(failed.createErrorMessage, 'INVALID_WORKFLOW');
  assert.equal(failed.error, 'BUSINESS_E2E_NOT_AT_APPROVAL:FAILED');
  assert.equal(failed.nodeCount, 31);
  assert.equal(summarizeStage({stage: 20, exitCode: 0, log: log(evidence({cleanup: {status: 'CLEANUP_INCOMPLETE'}}))}).status, 'FAIL');
  assert.throws(() => summarizeStage({stage: 25, exitCode: 0, log: ''}), /STAGE_NOT_ALLOWED/);
});

test('large workflow tool is manual-only, main-only, confirmed, single job and cannot deploy or promote', () => {
  const triggers = workflow.slice(workflow.indexOf('\non:'), workflow.indexOf('\npermissions:'));
  assert.match(triggers, /workflow_dispatch:/);
  assert.doesNotMatch(triggers, /\n  (push|pull_request|workflow_run|schedule):/);
  assert.match(workflow, /if: \$\{\{ github\.ref == 'refs\/heads\/main' && inputs\.confirm == 'R-08' \}\}/);
  assert.match(workflow, /case "\$STAGE" in 20\|40\|60\|80\|100\)/);
  assert.doesNotMatch(workflow, /wrangler|versions (upload|deploy)|npm run build|cloudflare\/wrangler-action|E2E_KEEP_ARTIFACTS/);
  assert.doesNotMatch(promotion, /R-08 Large Workflow E2E/);
  assert.match(workflow, /CORRELATION_ID=craftflow-large-\$\{GITHUB_RUN_ID\}-\$\{GITHUB_RUN_ATTEMPT\}-n\$\{STAGE\}/);
});

test('business E2E records sizes and durations but no prompt or workflow content', () => {
  assert.match(business, /promptChars: prompt\.length/);
  assert.match(business, /evidence\.runMetrics\.create = created\?\.runMetrics \?\? null/);
  assert.match(business, /evidence\.runMetrics\.approve = approved\?\.runMetrics \?\? null/);
  assert.match(business, /evidence\.timingMs\.total = Date\.now\(\) - startedAt/);
  assert.doesNotMatch(business, /evidence\.prompt\s*=/);
});
