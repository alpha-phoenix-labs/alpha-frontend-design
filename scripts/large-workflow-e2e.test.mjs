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

const passingQuality = () => ({status: 'PASS', definedCases: 4, passedCases: 4, failedCases: 0, notVerifiedCases: 0, webhookAuth: 'VERIFIED', errorWorkflow: true,
  cases: [{caseId: 'TC-1', kind: 'SUCCESS', result: 'PASS', reason: null}]});
const evidence = (overrides = {}) => ({
  correlationId: 'craftflow-large-1-1-n20', phase: 'final', jobId: 'job-20', submittedStatus: 'WAITING_FOR_APPROVAL',
  promptChars: 1500, createErrorMessage: null, timingMs: {create: 61000, approve: 9000, total: 90000},
  runtimeTruth: {matches: true}, n8n: {executionId: '50', importedId: 'wf'}, drive: {status: 'COMPLETE'},
  cleanup: {status: 'CLEANUP_OK'},
  runMetrics: {
    create: {nodeCount: 20, connectionCount: 19, workflowBytes: 9000, testReportBytes: 120, builderRetries: 1, stepRuns: {BUILDER: 1},
      phaseMs: {BOSS: 900, ARCHITECT: 4000, BUILDER: 40000, SECURITY: 2, TESTER: 6000}, testerMs: {importMs: 800, activateMs: 600, webhookMs: 3000, executionReadMs: 300}},
    approve: {nodeCount: 20, connectionCount: 19, workflowBytes: 9000, testReportBytes: 120, documentationBytes: 700, phaseMs: {DOCS: 3}, quality: passingQuality()},
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

test('fewer nodes than the stage target or a failed run are FAIL; cleanup is no PASS criterion', () => {
  const tooSmall = evidence();
  tooSmall.runMetrics.approve.nodeCount = 12;
  assert.equal(summarizeStage({stage: 20, exitCode: 0, log: log(tooSmall)}).checks.nodeCountReached, false);
  const failed = summarizeStage({stage: 40, exitCode: 1, log: log(evidence({phase: 'create-job-via-frontend', submittedStatus: 'FAILED', createErrorMessage: 'INVALID_WORKFLOW', runMetrics: {create: {nodeCount: 31, phaseMs: {BUILDER: 50000}}, approve: null}}), false)});
  assert.equal(failed.status, 'FAIL');
  assert.equal(failed.failedPhase, 'create-job-via-frontend');
  assert.equal(failed.createErrorMessage, 'INVALID_WORKFLOW');
  assert.equal(failed.error, 'BUSINESS_E2E_NOT_AT_APPROVAL:FAILED');
  assert.equal(failed.nodeCount, 31);
  assert.equal(summarizeStage({stage: 20, exitCode: 0, log: log(evidence({cleanup: {status: 'CLEANUP_DISABLED'}}))}).status, 'PASS');
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

test('create-timeout recovery is off by default and enabled (bounded) only for the large-workflow tool', () => {
  const realE2e = readFileSync(new URL('../.github/workflows/real-e2e.yml', import.meta.url), 'utf8');
  const gate = readFileSync(new URL('../.github/workflows/post-deploy-production-gate.yml', import.meta.url), 'utf8');
  assert.match(business, /Math\.min\(900_000, Number\(process\.env\.E2E_CREATE_RECOVERY_MS\) \|\| 0\)/);
  assert.doesNotMatch(realE2e, /E2E_CREATE_RECOVERY_MS/);
  assert.doesNotMatch(gate, /E2E_CREATE_RECOVERY_MS/);
  assert.match(workflow, /E2E_CREATE_RECOVERY_MS=600000 /);
});

test('a create timeout stays FAIL but keeps recovery evidence', () => {
  const e = evidence({phase: 'create-timeout-recovery', jobId: 'job-late', submittedStatus: null, createTimedOut: true, clientRequestId: 'req-1',
    recovery: {attempted: true, polls: 4, waitedMs: 31000, finalStatus: 'WAITING_FOR_APPROVAL', lookupStatus: 200}});
  const s = summarizeStage({stage: 20, exitCode: 1, log: log(e, false)});
  assert.equal(s.status, 'FAIL');
  assert.equal(s.createTimedOut, true);
  assert.equal(s.clientRequestId, 'req-1');
  assert.equal(s.recovery.finalStatus, 'WAITING_FOR_APPROVAL');
  assert.equal(s.jobId, 'job-late');
});

test('R-08 async: a 202 create is polled (bounded) until it leaves the pre-approval statuses; sync 200 is unchanged', () => {
  assert.match(business, /const PIPELINE_STATUSES = new Set\(\['CREATED', 'PLANNED', 'BUILDING', 'SECURITY_REVIEW', 'TESTING'\]\)/);
  assert.match(business, /Math\.min\(1_800_000, Number\(process\.env\.E2E_JOB_WAIT_MS\) \|\| 600_000\)/);
  assert.match(business, /if \(createResponse\.status\(\) === 202\) \{/);
  assert.match(business, /BUSINESS_E2E_ASYNC_PIPELINE_TIMEOUT/);
  // The test mark is set before waiting, i.e. well inside the backend's 15 min mark window.
  assert.ok(business.indexOf('await markTestJob();\n\n  if (createResponse.status() === 202)') > 0);
  const s = summarizeStage({stage: 20, exitCode: 0, log: log(evidence({createHttpStatus: 202, timingMs: {create: 300, pipeline: 95000, approve: 9000, total: 120000},
    asyncWait: {polls: 30, waitedMs: 94000, lastStatus: 'WAITING_FOR_APPROVAL', lookupStatus: 200}}))});
  assert.equal(s.status, 'PASS');
  assert.equal(s.createHttpStatus, 202);
  assert.equal(s.durationsMs.asyncPipeline, 95000);
  assert.equal(s.asyncWait.lastStatus, 'WAITING_FOR_APPROVAL');
});

test('R-08 async: the UI approval gate is awaited (bounded) and its last text is kept as evidence', () => {
  assert.match(business, /waitForFunction\(\s*\(\) => document\.querySelector\('\[data-testid="factory-status"\]'\)\?\.textContent\?\.trim\(\) === 'awaiting_human'/);
  assert.match(business, /\{ timeout: 20_000, polling: 250 \}/);
  assert.match(business, /evidence\.uiGate = \{ waitedMs: Date\.now\(\) - uiGateStartedAt, lastText:/);
  assert.doesNotMatch(business, /if \(\(await status\.textContent\(\)\)\?\.trim\(\) !== 'awaiting_human'\)/);
  const s = summarizeStage({stage: 20, exitCode: 1, log: log(evidence({phase: 'approval-gate', uiGate: {waitedMs: 20000, lastText: 'testing'}}), false)});
  assert.equal(s.status, 'FAIL');
  assert.deepEqual(s.uiGate, {waitedMs: 20000, lastText: 'testing'});
});

test('R-08: each stage size is justified by exactly stage-1 distinct business steps (no filler nodes)', () => {
  for (const stage of STAGES) {
    const text = largeWorkflowPrompt(stage, `craftflow-large-1-1-n${stage}`);
    const steps = text.split('\n').filter((line) => /^\d+\. /.test(line)).map((line) => line.replace(/^\d+\. /, ''));
    assert.equal(steps.length, stage - 1, `${stage}: step count`);
    assert.equal(new Set(steps).size, steps.length, `${stage}: duplicate steps`);
    assert.match(text, new RegExp(`genau diesen ${stage - 1} fachlichen Schritten`));
    assert.match(text, /Keine Füll-Nodes/);
    assert.match(text, /ohne Schleifen/);
  }
});

test('R-08: the stage summary reports the job LLM usage (tokens, cost) from the latest run metrics', () => {
  const e = evidence();
  e.runMetrics.create.llmTokens = 9000; e.runMetrics.create.llmCostUsd = 0.004;
  e.runMetrics.approve.llmTokens = 9500; e.runMetrics.approve.llmCostUsd = 0.0042; e.runMetrics.approve.llmCostUnknown = false;
  assert.deepEqual(summarizeStage({stage: 20, exitCode: 0, log: log(e)}).llmUsage, {tokens: 9500, costUsd: 0.0042, costUnknown: false});
  assert.deepEqual(summarizeStage({stage: 20, exitCode: 0, log: log(evidence())}).llmUsage, {tokens: null, costUsd: null, costUnknown: false});
});

test('QG-001: stage 20 is the R-20-QUALITY reference with fixed requirements and test cases', () => {
  const text = largeWorkflowPrompt(20, 'craftflow-large-1-1-n20');
  for (const part of ['REQ-1 / RISK-1', 'Header-Authentifizierung', 'echte Entscheidung (IF)', 'Stop and Error', 'kein Retry',
    'https://api.vantarialabs.tech/api/test-fixture/transient', 'separaten Fehler-Workflow', 'TC-1 SUCCESS', 'TC-2 TRANSIENT_ERROR', 'TC-3 VALIDATION_ERROR',
    'Correlation ID schreiben', 'keine weiteren Entscheidungen, Fehler- oder Retry-Nodes'])
    assert.ok(text.includes(part), part);
  assert.doesNotMatch(text, /durchgehende Kette/);
  const forty = largeWorkflowPrompt(40, 'craftflow-large-1-1-n40');
  assert.doesNotMatch(forty, /R-20-QUALITY/);
});

test('QG-001: stage 20 passes only with every quality case verified, webhook auth, error workflow and Drive archive', () => {
  const pass = summarizeStage({stage: 20, exitCode: 0, log: log(evidence())});
  assert.equal(pass.status, 'PASS');
  assert.deepEqual(pass.quality, passingQuality());
  const variants = [
    ['qualityCasesPass', (q) => { q.status = 'NOT_VERIFIED'; q.notVerifiedCases = 1; q.passedCases = 3; }],
    ['webhookAuthVerified', (q) => { q.webhookAuth = 'NOT_VERIFIED'; }],
    ['errorWorkflow', (q) => { q.errorWorkflow = false; }],
  ];
  for (const [check, mutate] of variants) {
    const e = evidence(); mutate(e.runMetrics.approve.quality);
    const s = summarizeStage({stage: 20, exitCode: 0, log: log(e)});
    assert.equal(s.status, 'FAIL', check); assert.equal(s.checks[check], false, check);
  }
  const noQuality = evidence(); noQuality.runMetrics.approve.quality = null;
  assert.equal(summarizeStage({stage: 20, exitCode: 0, log: log(noQuality)}).status, 'FAIL');
  const noDrive = summarizeStage({stage: 20, exitCode: 0, log: log(evidence({drive: {status: 'BLOCKED'}}))});
  assert.equal(noDrive.checks.driveArchived, false); assert.equal(noDrive.status, 'FAIL');
  const forty = evidence(); forty.runMetrics.approve.nodeCount = 40; forty.runMetrics.approve.quality = null;
  const s40 = summarizeStage({stage: 40, exitCode: 0, log: log(forty)});
  assert.equal('qualityCasesPass' in s40.checks, false);
});

test('R-08 T1: an optional prompt length target adds only background facts, keeps the steps and stays within the backend limit', () => {
  const id = 'craftflow-large-36994530333-1-n60';
  const base = largeWorkflowPrompt(60, id);
  const long = largeWorkflowPrompt(60, id, 7900);
  assert.ok(Math.abs(long.length - 7900) <= 20 && long.length <= 8000, `length ${long.length}`);
  const steps = (text) => text.split('\n').filter((line) => /^\d+\. /.test(line));
  assert.deepEqual(steps(long), steps(base), 'same business steps, no extra node');
  assert.match(long, /Betriebskontext \(nur Hintergrund, keine zusätzlichen Schritte, Nodes oder Regeln\):/);
  assert.equal(long.replace(/Betriebskontext[^]*?\n(?=Der Workflow besteht)/, ''), base, 'only the context block differs');
  assert.equal(largeWorkflowPrompt(60, id, ''), base);
  for (const bad of [8101, 1000, 'abc', 7900.5]) assert.throws(() => largeWorkflowPrompt(60, id, bad), /INVALID_PROMPT_TARGET/);
  assert.match(workflow, /prompt_chars:/);
  assert.match(workflow, /PROMPT_CHARS_INVALID/);
  assert.match(workflow, /large-workflow-prompts\.mjs "\$STAGE" "\$CORRELATION_ID" "\$\{PROMPT_CHARS:-\}"/);
});

test('R-08 T2: a target above the backend limit builds an over-limit order; the summary passes only for a 400 rejection without a job', () => {
  const id = 'craftflow-large-1-1-n60';
  const over = largeWorkflowPrompt(60, id, 8050);
  assert.ok(over.length > 8000 && Math.abs(over.length - 8050) <= 20, `length ${over.length}`);
  assert.throws(() => largeWorkflowPrompt(60, id, 8101), /INVALID_PROMPT_TARGET/);
  const run = (patch) => {
    const e = {phase: 'final', promptChars: 8048, jobId: null, createHttpStatus: 400, runtimeTruth: {matches: true}, promptLimit: {rejectedStatus: 400, noJobLookupStatus: 404}, ...patch};
    return summarizeStage({stage: 60, exitCode: 0, log: `REAL_BUSINESS_E2E_EVIDENCE=${JSON.stringify(e)}\nREAL_E2E_PASS`, expectPromptRejected: true});
  };
  assert.equal(run({}).status, 'PASS');
  assert.deepEqual(run({}).promptLimit, {rejectedStatus: 400, noJobLookupStatus: 404});
  assert.equal(run({createHttpStatus: 202, promptLimit: {rejectedStatus: 202, noJobLookupStatus: 404}}).status, 'FAIL', 'accepted = FAIL');
  assert.equal(run({jobId: 'cmx'}).status, 'FAIL', 'job created = FAIL');
  assert.equal(run({promptLimit: {rejectedStatus: 400, noJobLookupStatus: 200}}).status, 'FAIL', 'job found = FAIL');
  assert.equal(run({promptChars: 7990}).status, 'FAIL', 'not over the limit = FAIL');
  const script = readFileSync('scripts/real-business-e2e.mjs', 'utf8');
  assert.match(script, /E2E_EXPECT_PROMPT_REJECTED === '1'/);
  assert.match(script, /BUSINESS_E2E_PROMPT_NOT_REJECTED/);
  assert.match(workflow, /-le 8100/);
  assert.match(workflow, /SUMMARY_MODE=expect-prompt-rejected/);
});
