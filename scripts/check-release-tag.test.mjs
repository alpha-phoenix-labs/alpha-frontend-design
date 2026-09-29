import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';

const checker = fileURLToPath(new URL('./check-release-tag.mjs', import.meta.url));
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function fixture(e2eStatus = 'PASS') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'craftflow-tag-check-'));
  const human = path.join(dir, 'human.md');
  const evidence = path.join(dir, 'evidence.md');
  fs.writeFileSync(human, 'human gate\n');
  fs.writeFileSync(evidence, 'evidence pack\n');
  const manifest = {
    status: 'BLOCKED',
    release: {
      frontend: {deployedSha: 'f'.repeat(40)},
      backend: {deployedSha: 'b'.repeat(40)},
      cloudflare: {versionId: 'cf-version', preE2EVersionId: 'cf-version', postE2EVersionId: 'cf-version'},
      productionE2E: {status: e2eStatus},
      humanGate: {recordPath: human, sha256: sha(human)},
      evidencePack: {path: evidence, sha256: sha(evidence)},
    },
    gates: {
      frontendMain: 'PASS', backendMainRenderLive: 'PASS', runtimePin: 'PASS', productionPromotion: 'PASS',
      postDeployProductionGate: 'PASS', productionDomainE2E: 'PASS', cloudflareDirectLiveReadback: 'PASS',
      formalHumanGate: 'PASS', evidencePack: 'PASS', coordinatedTags: 'OPEN', m1ProductionFreeze: 'BLOCKED',
    },
  };
  const manifestPath = path.join(dir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest));
  return {dir, manifestPath, manifest};
}

function run(manifestPath, mode, env = {}) {
  return spawnSync(process.execPath, [checker, manifestPath, mode], {encoding: 'utf8', env: {...process.env, ...env}});
}

test('OPEN production E2E fails', () => {
  const f = fixture('OPEN');
  const result = run(f.manifestPath, 'pre');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /PRODUCTION_E2E_NOT_PASS/);
});

test('pre passes before coordinated tags and freeze close', () => {
  const f = fixture();
  const result = run(f.manifestPath, 'pre');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /TAG_MANIFEST_CHECK=PASS mode=pre/);
});

test('verify checks tag target against deployedSha', () => {
  const f = fixture();
  const result = run(f.manifestPath, 'verify', {
    RELEASE_TAG_KIND: 'frontend',
    RELEASE_TAG_TARGET_SHA: f.manifest.release.frontend.deployedSha,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /TAG_MANIFEST_CHECK=PASS mode=verify/);
});
