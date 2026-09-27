import { spawn } from 'node:child_process';
import net from 'node:net';
import { chromium } from 'playwright';

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

const backendPort = await reserveAndReleasePort();
const frontendPort = await reserveAndReleasePort();
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
const unavailableBackendUrl = `http://127.0.0.1:${backendPort}`;

const vite = spawn(
  process.execPath,
  ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(frontendPort), '--strictPort'],
  {
    env: {
      ...process.env,
      VITE_FACTORY_MODE: 'http',
      VITE_FACTORY_API_BASE_URL: unavailableBackendUrl,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

let viteOutput = '';
vite.stdout.on('data', (chunk) => { viteOutput += String(chunk).slice(-2000); });
vite.stderr.on('data', (chunk) => { viteOutput += String(chunk).slice(-2000); });

const waitForFrontend = async () => {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(frontendUrl, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('NEGATIVE_FRONTEND_START_TIMEOUT');
};

let browser;
try {
  await waitForFrontend();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(frontendUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });

  const unavailable = page.getByTestId('auth-gate-unavailable');
  await unavailable.waitFor({ state: 'visible', timeout: 10_000 });

  const workspaceVisible =
    (await page.getByPlaceholder('Describe the workflow you want Craftflow to build').count()) > 0;
  const loginVisible = (await page.getByTestId('auth-login-link').count()) > 0;

  if (workspaceVisible || loginVisible) {
    throw new Error('BACKEND_UNAVAILABLE_DID_NOT_FAIL_CLOSED');
  }

  console.log('BACKEND_UNAVAILABLE_NEGATIVE_PASS=' + JSON.stringify({
    failClosedVisible: true,
    workspaceVisible,
    loginVisible,
  }));
} catch (error) {
  console.error('::error::' + (error instanceof Error ? error.message : 'BACKEND_UNAVAILABLE_NEGATIVE_TEST_FAILED'));
  if (viteOutput) console.error(viteOutput.slice(-1000));
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  vite.kill('SIGTERM');
}
