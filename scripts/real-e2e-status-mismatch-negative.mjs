import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// Run the same real browser test; only the expected status is deliberately wrong.
const result = spawnSync(process.execPath, [new URL('./real-e2e-smoke.mjs', import.meta.url).pathname], {
  env: { ...process.env, E2E_EXPECTED_FACTORY_STATUS: 'failed' },
  encoding: 'utf8',
  timeout: 90_000,
  maxBuffer: 2 * 1024 * 1024,
});
const output = (result.stdout ?? '') + (result.stderr ?? '');

// Export bounded, redacted diagnostics before assertions can stop the wrapper.
const redact = (text) => {
  let safe = text;
  for (const [key, value] of Object.entries(process.env)) {
    if (/SECRET|TOKEN|PASSWORD|EMAIL|KEY/i.test(key) && value && value.length >= 4) {
      safe = safe.split(value).join('[REDACTED]');
    }
  }
  return safe;
};
const summarize = (text) => text.split('\n').flatMap((line) => {
  if (line.startsWith('REAL_E2E_EVIDENCE=')) {
    try {
      const data = JSON.parse(line.slice('REAL_E2E_EVIDENCE='.length));
      // Browser console output and navigation URLs are not needed for diagnosis.
      if (data.browser) delete data.browser.consoleErrors;
      if (data.login) delete data.login.finalUrl;
      return [redact('REAL_E2E_EVIDENCE=' + JSON.stringify(data))];
    } catch { return ['INVALID_CHILD_EVIDENCE']; }
  }
  if (line.startsWith('::error::')) return [redact(line.slice(0, 500))];
  return [];
});
console.log('STATUS_MISMATCH_CHILD=' + JSON.stringify({
  frontendSha: process.env.E2E_FRONTEND_SHA,
  exitCode: result.status,
  signal: result.signal,
  runnerErrorCode: result.error?.code ?? null,
  stdout: summarize(result.stdout ?? ''),
  stderr: summarize(result.stderr ?? ''),
  expectedMarker: '::error::REAL_E2E_FAIL',
  expectedMarkerPresent: output.includes('::error::REAL_E2E_FAIL'),
  realE2ePassPresent: output.includes('REAL_E2E_PASS'),
}));

assert.equal(result.error, undefined, 'Browser runner must complete');
assert.equal(result.status, 1, 'Wrong expected status must fail');
assert.ok(!output.includes('REAL_E2E_PASS'), 'Mismatch must never report PASS');
assert.ok(output.includes('::error::REAL_E2E_FAIL'), 'Expected visible gate failure');
const line = output.split('\n').filter(line => line.startsWith('REAL_E2E_EVIDENCE=')).at(-1);
assert.ok(line, 'Real browser evidence is required');
const evidence = JSON.parse(line.slice('REAL_E2E_EVIDENCE='.length));
assert.equal(evidence.login.ok, true);
assert.equal(evidence.cookie.securityAttributesValid, true);
assert.equal(evidence.cookie.sentToFactoryGet, true);
assert.equal(evidence.runtimeTruth.status, 200);
assert.equal(evidence.get.status, 200);
assert.equal(evidence.get.redirected, false);
assert.equal(evidence.get.responseSeenByBrowser, true);
assert.equal(evidence.browser.requestFailed, null);
assert.deepEqual(evidence.ui, {
  factoryStatusRendered: true, status: 'completed', expectedStatus: 'failed', statusMatches: false,
});
console.log('STATUS_MISMATCH_NEGATIVE_PASS=' + JSON.stringify({ childExitCode: result.status, ui: evidence.ui }));
