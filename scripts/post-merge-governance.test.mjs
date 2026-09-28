import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const preview = readFileSync(new URL('../.github/workflows/cloudflare-deploy-test.yml', import.meta.url), 'utf8');
const promotion = readFileSync(new URL('../.github/workflows/production-promotion.yml', import.meta.url), 'utf8');

function validatePreview(text) {
  const trigger = text.split('\npermissions:')[0];
  assert.match(trigger, /\n  push:\n    branches:\n      - main\n/, 'main push trigger missing');
  assert.match(trigger, /\n  pull_request:\n    branches:\n      - main\n/, 'PR trigger missing');
  assert.doesNotMatch(trigger, /paths(?:-ignore)?:|branches-ignore:/, 'mandatory triggers must not be path-filtered');
  assert.doesNotMatch(text, /continue-on-error:\s*true/, 'failures must propagate');
  assert.match(text, /command: versions upload/, 'no-traffic upload required');
  assert.doesNotMatch(text, /command: deploy\b/, 'deploy-test must never route production traffic');

  const guardIndex = text.indexOf('- name: Block permanent design sandbox from Cloudflare');
  const uploadIndex = text.indexOf('- name: Upload version to Cloudflare (no traffic)');
  assert.ok(guardIndex >= 0, 'design sandbox hard-stop missing');
  assert.ok(uploadIndex >= 0, 'Cloudflare upload step missing');
  assert.ok(guardIndex < uploadIndex, 'design sandbox hard-stop must run before Cloudflare upload');
  assert.match(
    text,
    /github\.head_ref == 'design\/v2-rebuild' \|\| github\.ref == 'refs\/heads\/design\/v2-rebuild'/,
    'design sandbox hard-stop must cover PR and direct branch execution',
  );
  assert.match(
    text,
    /github\.head_ref != 'design\/v2-rebuild' && github\.ref != 'refs\/heads\/design\/v2-rebuild'/,
    'Cloudflare upload itself must independently exclude design sandbox',
  );
}

function validatePromotion(text) {
  assert.match(text, /workflow_run:[\s\S]*workflows:[\s\S]*- Real E2E[\s\S]*types:[\s\S]*- completed/, 'automatic Real E2E completion trigger required');
  assert.match(text, /github\.event\.workflow_run\.event == 'push'/);
  assert.match(text, /github\.event\.workflow_run\.head_branch == 'main'/);
  assert.match(text, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(text, /TARGET_SHA: \$\{\{ github\.event\.workflow_run\.head_sha \}\}/);
  assert.match(text, /ref: \$\{\{ env\.TARGET_SHA \}\}/);
  assert.match(text, /GITHUB_SHA: \$\{\{ env\.TARGET_SHA \}\}/);
  assert.match(text, /run: \|[\s\S]*node scripts\/promotion-gate\.mjs/);
  assert.match(text, /command: deploy\b/);
  assert.ok(text.indexOf('node scripts/promotion-gate.mjs') < text.indexOf('command: deploy'), 'promotion gate must precede deploy');
  assert.doesNotMatch(text, /workflow_dispatch:/, 'production promotion must not depend on manual dispatch');
  assert.doesNotMatch(text, /continue-on-error:\s*true/, 'promotion failures must propagate');
}

test('no-traffic deploy-test remains mandatory', () => validatePreview(preview));
test('automatic exact-SHA production promotion is enforced', () => validatePromotion(promotion));
test('removing main push from deploy-test fails closed', () => assert.throws(() => validatePreview(preview.replace(/\n  push:\n    branches:\n      - main\n/, '\n'))));
test('adding production deploy to deploy-test is rejected', () => assert.throws(() => validatePreview(preview + '\ncommand: deploy\n')));
test('removing design sandbox hard-stop is rejected', () => assert.throws(() => validatePreview(preview.replace(
  /      - name: Block permanent design sandbox from Cloudflare[\s\S]*?\n\n      - name: Checkout exact SHA/,
  '      - name: Checkout exact SHA',
))));
test('weakening Cloudflare upload exclusion for design sandbox is rejected', () => assert.throws(() => validatePreview(preview.replace(
  "        if: ${{ github.head_ref != 'design/v2-rebuild' && github.ref != 'refs/heads/design/v2-rebuild' }}\n        uses: cloudflare/wrangler-action@v4",
  '        uses: cloudflare/wrangler-action@v4',
))));
test('manual-only production promotion is rejected', () => assert.throws(() => validatePromotion(promotion.replace(/workflow_run:[\s\S]*?permissions:/, 'workflow_dispatch:\n\npermissions:'))));
test('promotion without exact triggering SHA is rejected', () => assert.throws(() => validatePromotion(promotion.replace('TARGET_SHA: ${{ github.event.workflow_run.head_sha }}', 'TARGET_SHA: ${{ github.sha }}'))));
test('promotion without post-merge gate is rejected', () => assert.throws(() => validatePromotion(promotion.replace('node scripts/promotion-gate.mjs', 'echo skipped'))));
