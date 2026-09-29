import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {test} from 'node:test';

const preview = readFileSync(new URL('../.github/workflows/cloudflare-deploy-test.yml', import.meta.url), 'utf8');
const promotion = readFileSync(new URL('../.github/workflows/production-promotion.yml', import.meta.url), 'utf8');
const postDeploy = readFileSync(new URL('../.github/workflows/post-deploy-production-gate.yml', import.meta.url), 'utf8');

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


function validatePostDeploy(text) {
  assert.match(text, /workflow_run:[\s\S]*workflows:[\s\S]*- Production Promotion[\s\S]*types:[\s\S]*- completed/, 'post-deploy gate must follow Production Promotion');
  assert.match(text, /github\.event\.workflow_run\.head_branch == 'main'/);
  assert.match(text, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(text, /E2E_PREVIEW_URL: https:\/\/control\.vantarialabs\.tech/, 'must test production domain');
  assert.match(text, /E2E_APPROVAL_MODE: AUTOMATED_TEST_APPROVAL/, 'automated approval must never be mislabeled human');
  assert.match(text, /node scripts\/n8n-preflight\.mjs/, 'n8n preflight required');
  assert.equal((text.match(/node scripts\/cloudflare-live-readback\.mjs/g)||[]).length, 2, 'Cloudflare readback required before and after E2E');
  assert.match(text, /EXPECTED_CLOUDFLARE_VERSION=/, 'promoted immutable version must be bound');
  assert.match(text, /node scripts\/real-business-e2e\.mjs/, 'production business E2E required');
  assert.ok(text.indexOf('Cloudflare LIVE readback before E2E') < text.indexOf('Run production-domain E2E'));
  assert.ok(text.indexOf('Run production-domain E2E') < text.indexOf('Cloudflare LIVE readback after E2E'));
  assert.doesNotMatch(text, /command: deploy\b/, 'post-deploy gate must not deploy');
  assert.doesNotMatch(text, /continue-on-error:\s*true/, 'post-deploy failures must propagate');
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

test('post-deploy production gate is enforced', () => validatePostDeploy(postDeploy));
test('preview target is rejected in post-deploy gate', () => assert.throws(() => validatePostDeploy(postDeploy.replace('https://control.vantarialabs.tech', 'https://preview.example.invalid'))));
test('single Cloudflare readback is rejected', () => assert.throws(() => validatePostDeploy(postDeploy.replace(/\n      - name: Cloudflare LIVE readback after E2E[\s\S]*?cloudflare-after\.log\n/, '\n'))));
