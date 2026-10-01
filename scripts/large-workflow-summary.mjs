// R-08: turns one large-workflow business E2E run into the evidence record required per stage.
import {readFileSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {parseRunLog} from './parallel-load-summary.mjs';
import {STAGES} from './large-workflow-prompts.mjs';

export function summarizeStage({stage, exitCode, log}) {
  if (!STAGES.includes(stage)) throw new Error('STAGE_NOT_ALLOWED');
  const {evidence: e, passed, error} = parseRunLog(log);
  const created = e?.runMetrics?.create ?? null;
  const approved = e?.runMetrics?.approve ?? null;
  const latest = approved ?? created;
  const nodeCount = Number.isInteger(latest?.nodeCount) ? latest.nodeCount : null;
  const e2ePass = exitCode === 0 && passed && e?.phase === 'final';
  const checks = {
    e2ePass,
    nodeCountReached: nodeCount !== null && nodeCount >= stage,
    runtimeTruthMatch: e?.runtimeTruth?.matches === true,
    cleanupOk: e?.cleanup?.status === 'CLEANUP_OK',
  };
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
      approveRequest: e?.timingMs?.approve ?? null,
      total: e?.timingMs?.total ?? null,
    },
    sizesBytes: {
      promptChars: e?.promptChars ?? null,
      workflow: latest?.workflowBytes ?? null,
      testReport: latest?.testReportBytes ?? null,
      documentation: approved?.documentationBytes ?? null,
    },
    n8n: {executionId: e?.n8n?.executionId ?? null, importedId: e?.n8n?.importedId ?? null},
    drive: e?.drive?.status ?? null,
    cleanup: e?.cleanup?.status ?? null,
  };
}

// CLI: node scripts/large-workflow-summary.mjs <stage> <run.log> <run.rc> <out.json>
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [stageArg, logFile, rcFile, out] = process.argv.slice(2);
  const read = (f) => { try { return readFileSync(f, 'utf8'); } catch { return ''; } };
  const rc = read(rcFile).trim();
  const summary = summarizeStage({stage: Number(stageArg), exitCode: rc === '' ? null : Number(rc), log: read(logFile)});
  writeFileSync(out, JSON.stringify(summary, null, 2));
  console.log('LARGE_WORKFLOW_SUMMARY=' + JSON.stringify(summary));
}
