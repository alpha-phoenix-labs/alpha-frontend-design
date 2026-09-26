import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
const source = readFileSync(new URL('../.github/workflows/cloudflare-deploy-test.yml', import.meta.url), 'utf8');
function validate(text) {
  const trigger = text.split('\npermissions:')[0];
  assert.match(trigger, /\n  push:\n    branches:\n      - main\n/, 'main push trigger missing');
  assert.match(trigger, /\n  pull_request:\n    branches:\n      - main\n/, 'PR trigger missing');
  assert.doesNotMatch(trigger, /paths(?:-ignore)?:|branches-ignore:/, 'mandatory triggers must not be path-filtered');
  assert.doesNotMatch(text, /continue-on-error:\s*true/, 'failures must propagate');
  assert.doesNotMatch(text.split('    steps:')[0], /\n    if:/, 'mandatory preview job must not be skipped');
  const real = "((github.event_name == 'push' && github.ref == 'refs/heads/main') || (github.event_name == 'workflow_dispatch' && (inputs.g5_preview == true || inputs.deploy == true)))";
  assert.ok(text.includes("VITE_FACTORY_MODE: " + "$" + "{{ " + real + " && 'http' || '' }}"), 'real preview and production must use HTTP');
  assert.ok(text.includes("VITE_FACTORY_API_BASE_URL: " + "$" + "{{ " + real + " && 'https://n8n-workflow-factory.onrender.com' || '' }}"), 'real base URL required');
  assert.ok(text.includes("if: " + "$" + "{{ github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' && inputs.deploy == true && inputs.g5_preview != true }}"), 'explicit production gate required');
  assert.ok(text.includes('command: versions upload'), 'no-traffic upload required');
  assert.ok(text.includes('test "$VITE_FACTORY_MODE" = "http"'), 'mode assertion required');
}
test('mandatory delivery configuration', () => validate(source));
test('removing main push fails closed', () => assert.throws(() => validate(source.replace(/\n  push:\n    branches:\n      - main\n/, '\n'))));
test('dispatch-only workflow fails closed', () => assert.throws(() => validate(source.replace(/\n  (push|pull_request):\n    branches:\n      - main\n/g, '\n'))));
test('silent failure masking is rejected', () => assert.throws(() => validate(source + '\ncontinue-on-error: true\n')));
test('empty production mode is rejected', () => assert.throws(() => validate(source.replaceAll(' || inputs.deploy == true', ''))));
test('automatic production routing is rejected', () => assert.throws(() => validate(source.replace("github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' && inputs.deploy == true && inputs.g5_preview != true", "github.ref == 'refs/heads/main'"))));

test('G5 preview plus deploy remains a hard error', () => {
  assert.ok(source.includes("github.event_name == 'workflow_dispatch' && inputs.g5_preview == true && inputs.deploy == true"));
  assert.match(source, /G5 preview must never use production deploy\.[\s\S]*?exit 1/);
});
test('promotion guard precedes production command', () => {
  const guard=source.indexOf('run: node scripts/promotion-gate.mjs');
  assert.ok(guard > 0 && guard < source.indexOf('command: deploy'));
  assert.ok(source.includes("if: " + "$" + "{{ github.event_name == 'workflow_dispatch' && inputs.deploy == true }}"));
  assert.ok(source.includes('actions: read'));
  assert.ok(source.includes('ref: ' + '$' + '{{ github.sha }}'));
});
