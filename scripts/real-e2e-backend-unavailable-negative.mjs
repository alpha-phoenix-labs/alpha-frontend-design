import { spawn } from 'node:child_process';
import net from 'node:net';

const reserveAndReleasePort = async () => {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('NEGATIVE_TEST_PORT_UNAVAILABLE');
  const port = address.port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
};

const port = await reserveAndReleasePort();
const child = spawn(process.execPath, ['scripts/real-e2e-smoke.mjs'], {
  env: {
    ...process.env,
    E2E_PREVIEW_URL: 'https://example.com',
    E2E_BACKEND_URL: `http://127.0.0.1:${port}`,
    E2E_OWNER_EMAIL: 'negative-test@example.invalid',
    E2E_OWNER_PASSWORD: 'negative-test-not-a-secret',
    E2E_FACTORY_JOB_ID: 'negative-backend-unavailable',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let stdout = '';
let stderr = '';
child.stdout.on('data', (chunk) => { stdout += String(chunk); });
child.stderr.on('data', (chunk) => { stderr += String(chunk); });

const outcome = await Promise.race([
  new Promise((resolve) => child.once('close', (code, signal) => resolve({ code, signal, timedOut: false }))),
  new Promise((resolve) => setTimeout(() => {
    child.kill('SIGKILL');
    resolve({ code: null, signal: 'SIGKILL', timedOut: true });
  }, 20_000)),
]);

const combined = stdout + '\n' + stderr;
const visibleFailure =
  outcome.timedOut === false &&
  outcome.code !== 0 &&
  combined.includes('REAL_E2E_EVIDENCE=') &&
  combined.includes('::error::') &&
  !combined.includes('REAL_E2E_PASS');

if (!visibleFailure) {
  console.error('::error::BACKEND_UNAVAILABLE_NEGATIVE_TEST_FAILED');
  console.error(JSON.stringify({ outcome, stdout: stdout.slice(-1000), stderr: stderr.slice(-1000) }));
  process.exit(1);
}

console.log('BACKEND_UNAVAILABLE_NEGATIVE_PASS');
console.log(JSON.stringify({ childExitCode: outcome.code, visiblyFailed: true }));
