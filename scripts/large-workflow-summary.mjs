// R-08: turns one large-workflow business E2E run into the evidence record required per stage.
import {readFileSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {parseRunLog} from './parallel-load-summary.mjs';
import {STAGES, QUALITY_REFERENCE_STAGE} from './large-workflow-prompts.mjs';

export function summarizeStage({stage, exitCode, log, expectPromptRejected = false}) {
  if (!STAGES.includes(stage)) throw new Error('STAGE_NOT_ALLOWED');
  const {evidence: e, passed, error} = parseRunLog(log);
  const created = e?.runMetrics?.create ?? null;
  const approved = e?.runMetrics?.approve ?? null;
  const latest = approved ?? created;
  const nodeCount = Number.isInteger(latest?.nodeCount) ? latest.nodeCount : null;
  const e2ePass = exitCode === 0 && passed && e?.phase === 'final';
  const checks = expectPromptRejected
    // R-08 T2: PASS = the over-limit order is rejected with 400 and no job exists for its clientRequestId.
    ? {
      e2ePass,
      runtimeTruthMatch: e?.runtimeTruth?.matches === true,
      promptOverLimit: Number.isInteger(e?.promptChars) && e.promptChars > 8000,
      promptRejected: e?.createHttpStatus === 400 && e?.promptLimit?.rejectedStatus === 400,
      noJobCreated: (e?.jobId ?? null) === null && e?.promptLimit?.noJobLookupStatus === 404,
    }
    : {
      e2ePass,
      nodeCountReached: nodeCount !== null && nodeCount >= stage,
      runtimeTruthMatch: e?.runtimeTruth?.matches === true,
    };
  // QG-001 §8: the quality reference passes only with every failure case verified and the package archived in Drive.
  const quality = latest?.quality ?? null;
  if (stage === QUALITY_REFERENCE_STAGE && !expectPromptRejected) {
    checks.qualityCasesPass = quality?.status === 'PASS' && quality.definedCases > 0 && quality.passedCases === quality.definedCases;
    checks.webhookAuthVerified = quality?.webhookAuth === 'VERIFIED';
    checks.errorWorkflow = quality?.errorWorkflow === true;
    checks.driveArchived = e?.drive?.status === 'COMPLETE';
  }
  return {
    schema: 1,
    roadmap: 'R-08',
    stage,
    status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
    checks,
    jobId: e?.jobId ?? null,
    correlationId: e?.correlationId ?? null,
    failedPhase: e2ePass ? null : e?.phase ?? null,
    error,
    submittedStatus: e?.submittedStatus ?? null,
    createErrorMessage: e?.createErrorMessage ?? null,
    clientRequestId: e?.clientRequestId ?? null,
    createTimedOut: e?.createTimedOut === true,
    createHttpStatus: e?.createHttpStatus ?? null,
    asyncWait: e?.asyncWait ?? null,
    uiGate: e?.uiGate ?? null,
    recovery: e?.recovery ?? null,
    nodeCount,
    connectionCount: latest?.connectionCount ?? null,
    builderRetries: created?.builderRetries ?? null,
    stepRuns: created?.stepRuns ?? null,
    durationsMs: {
      boss: created?.phaseMs?.BOSS ?? null,
      architect: created?.phaseMs?.ARCHITECT ?? null,
      builder: created?.phaseMs?.BUILDER ?? null,
      security: created?.phaseMs?.SECURITY ?? null,
      tester: created?.phaseMs?.TESTER ?? null,
      n8nImport: created?.testerMs?.importMs ?? null,
      n8nActivate: created?.testerMs?.activateMs ?? null,
      n8nWebhookExecution: created?.testerMs?.webhookMs ?? null,
      n8nExecutionRead: created?.testerMs?.executionReadMs ?? null,
      docs: approved?.phaseMs?.DOCS ?? null,
      createRequest: e?.timingMs?.create ?? null,
      asyncPipeline: e?.timingMs?.pipeline ?? null,
      approveRequest: e?.timingMs?.approve ?? null,
      total: e?.timingMs?.total ?? null,
    },
    sizesBytes: {
      promptChars: e?.promptChars ?? null,
      workflow: latest?.workflowBytes ?? null,
      testReport: latest?.testReportBytes ?? null,
      documentation: approved?.documentationBytes ?? null,
    },
    // R-08: cumulative LLM usage of the job as stored by the backend (numbers only).
    llmUsage: {
      tokens: latest?.llmTokens ?? null,
      costUsd: latest?.llmCostUsd ?? null,
      costUnknown: latest?.llmCostUnknown === true,
    },
    // QG-001: quality case outcome as reported by the backend (codes and counts only).
    quality,
    n8n: {executionId: e?.n8n?.executionId ?? null, importedId: e?.n8n?.importedId ?? null},
    promptLimit: e?.promptLimit ?? null,
    drive: e?.drive?.status ?? null,
    cleanup: e?.cleanup?.status ?? null,
  };
}

// CLI: node scripts/large-workflow-summary.mjs <stage> <run.log> <run.rc> <out.json>
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [stageArg, logFile, rcFile, out, mode] = process.argv.slice(2);
  const read = (f) => { try { return readFileSync(f, 'utf8'); } catch { return ''; } };
  const rc = read(rcFile).trim();
  const summary = summarizeStage({stage: Number(stageArg), exitCode: rc === '' ? null : Number(rc), log: read(logFile), expectPromptRejected: mode === 'expect-prompt-rejected'});
  writeFileSync(out, JSON.stringify(summary, null, 2));
  console.log('LARGE_WORKFLOW_SUMMARY=' + JSON.stringify(summary));
}
