// R-07d: aggregates N parallel real business E2E runs into one fail-closed load verdict.
import {readFileSync, readdirSync, writeFileSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

export const ALLOWED_PARALLEL = Object.freeze([3, 5]);

const EVIDENCE_PREFIX = 'REAL_BUSINESS_E2E_EVIDENCE=';

export function parseRunLog(text) {
  const lines = text.split('\n');
  const evidenceLine = lines.filter(line => line.startsWith(EVIDENCE_PREFIX)).at(-1);
  let evidence = null;
  if (evidenceLine) {
    try { evidence = JSON.parse(evidenceLine.slice(EVIDENCE_PREFIX.length)); } catch { evidence = null; }
  }
  const error = lines.map(line => line.match(/^::error::(.*)$/)?.[1]).filter(Boolean).at(-1) ?? null;
  return {evidence, passed: lines.includes('REAL_E2E_PASS'), error};
}

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

// runs: [{index, exitCode, durationMs, log}]
export function summarize({parallel, runs, startSkewMs = null}) {
  if (!ALLOWED_PARALLEL.includes(parallel)) throw new Error('PARALLEL_NOT_ALLOWED');
  if (runs.length !== parallel) throw new Error('RUN_COUNT_MISMATCH');
  const rows = runs.map(run => {
    const {evidence, passed, error} = parseRunLog(run.log);
    return {
      index: run.index,
      pass: run.exitCode === 0 && passed && evidence?.phase === 'final',
      exitCode: run.exitCode,
      durationMs: Number.isFinite(run.durationMs) ? run.durationMs : null,
      correlationId: evidence?.correlationId ?? null,
      jobId: evidence?.jobId ?? null,
      phase: evidence?.phase ?? null,
      error,
      n8nExecutionId: evidence?.n8n?.executionId ?? null,
      runtimeTruthMatches: evidence?.runtimeTruth?.matches === true,
      cleanup: evidence?.cleanup?.status ?? null,
    };
  });
  const jobIds = rows.map(row => row.jobId).filter(Boolean);
  const correlationIds = rows.map(row => row.correlationId).filter(Boolean);
  const executionIds = rows.map(row => row.n8nExecutionId).filter(Boolean);
  const duplicates = values => [...new Set(values.filter((value, i) => values.indexOf(value) !== i))];
  const durations = rows.map(row => row.durationMs).filter(Number.isFinite).sort((a, b) => a - b);
  const passCount = rows.filter(row => row.pass).length;
  const checks = {
    allPass: passCount === parallel,
    distinctJobIds: jobIds.length === parallel && duplicates(jobIds).length === 0,
    distinctCorrelationIds: correlationIds.length === parallel && duplicates(correlationIds).length === 0,
    distinctN8nExecutions: executionIds.length === parallel && duplicates(executionIds).length === 0,
    allRuntimeTruthMatch: rows.every(row => row.runtimeTruthMatches),
    allCleanupOk: rows.every(row => row.cleanup === 'CLEANUP_OK'),
  };
  return {
    schema: 1,
    status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
    parallel,
    checks,
    metrics: {
      passCount,
      failCount: parallel - passCount,
      errorRate: (parallel - passCount) / parallel,
      duplicateJobIds: duplicates(jobIds),
      durationMs: {min: durations[0] ?? null, p50: percentile(durations, 50), p95: percentile(durations, 95), max: durations.at(-1) ?? null},
      startSkewMs,
    },
    runs: rows,
  };
}

// CLI: node scripts/parallel-load-summary.mjs <dir> <parallel> <out.json>
// <dir> holds run-<i>.log, run-<i>.rc, run-<i>.start, run-<i>.end (epoch ms).
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const [dir, parallelArg, out] = process.argv.slice(2);
  const parallel = Number(parallelArg);
  const read = (name, fallback = '') => { try { return readFileSync(join(dir, name), 'utf8'); } catch { return fallback; } };
  const indexes = readdirSync(dir).map(f => f.match(/^run-(\d+)\.log$/)?.[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
  const starts = [];
  const runs = indexes.map(index => {
    const start = Number(read(`run-${index}.start`).trim());
    const end = Number(read(`run-${index}.end`).trim());
    if (Number.isFinite(start) && start > 0) starts.push(start);
    const rc = read(`run-${index}.rc`).trim();
    return {index, exitCode: rc === '' ? null : Number(rc), durationMs: start > 0 && end >= start ? end - start : null, log: read(`run-${index}.log`)};
  });
  const startSkewMs = starts.length ? Math.max(...starts) - Math.min(...starts) : null;
  const summary = summarize({parallel, runs, startSkewMs});
  mkdirSync(join(out, '..'), {recursive: true});
  writeFileSync(out, JSON.stringify(summary, null, 2));
  console.log('PARALLEL_LOAD_SUMMARY=' + JSON.stringify({status: summary.status, parallel, checks: summary.checks, metrics: summary.metrics}));
}
