#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const manifestPath = process.argv[2] || 'release/release-manifest.json';
const mode = process.argv[3];
if (!['pre', 'verify'].includes(mode || '')) throw new Error('RELEASE_TAG_MODE_INVALID');
const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const req = (value, code) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(code);
  return value;
};

if (m.release?.productionE2E?.status !== 'PASS') throw new Error('PRODUCTION_E2E_NOT_PASS');

const versionId = req(m.release?.cloudflare?.versionId, 'CLOUDFLARE_VERSION_MISSING');
if (m.release?.cloudflare?.preE2EVersionId !== versionId || m.release?.cloudflare?.postE2EVersionId !== versionId) {
  throw new Error('CLOUDFLARE_VERSION_MISMATCH');
}

const excludedGates = new Set(['coordinatedTags', 'm1ProductionFreeze']);
const requiredGates = [
  'frontendMain',
  'backendMainRenderLive',
  'runtimePin',
  'productionPromotion',
  'postDeployProductionGate',
  'productionDomainE2E',
  'cloudflareDirectLiveReadback',
  'formalHumanGate',
  'evidencePack',
];
for (const gate of requiredGates) {
  if (m.gates?.[gate] !== 'PASS') throw new Error(`GATE_NOT_PASS:${gate}`);
}
for (const [gate, status] of Object.entries(m.gates || {})) {
  if (!excludedGates.has(gate) && status !== 'PASS') throw new Error(`GATE_NOT_PASS:${gate}`);
}

req(m.release?.frontend?.deployedSha, 'FRONTEND_DEPLOYED_SHA_MISSING');
req(m.release?.backend?.deployedSha, 'BACKEND_DEPLOYED_SHA_MISSING');

function verifyFileHash(section, label) {
  const path = req(section?.path ?? section?.recordPath, `${label}_PATH_MISSING`);
  const expected = req(section?.sha256, `${label}_SHA256_MISSING`).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(expected)) throw new Error(`${label}_SHA256_INVALID`);
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
  if (actual !== expected) throw new Error(`${label}_SHA256_MISMATCH`);
}
verifyFileHash(m.release?.humanGate, 'HUMAN_GATE');
verifyFileHash(m.release?.evidencePack, 'EVIDENCE_PACK');

if (mode === 'verify') {
  const kind = process.env.RELEASE_TAG_KIND;
  if (!['frontend', 'backend'].includes(kind || '')) throw new Error('RELEASE_TAG_KIND_INVALID');
  const target = req(process.env.RELEASE_TAG_TARGET_SHA, 'RELEASE_TAG_TARGET_SHA_MISSING');
  const deployedSha = m.release[kind].deployedSha;
  if (target !== deployedSha) throw new Error(`TAG_TARGET_${kind.toUpperCase()}_DEPLOYED_SHA_MISMATCH`);
}

console.log(`TAG_MANIFEST_CHECK=PASS mode=${mode}`);
