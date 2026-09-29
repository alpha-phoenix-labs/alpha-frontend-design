#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const manifestPath = process.argv[2] || 'release/release-manifest.json';
const outputPath = process.argv[3] || 'evidence/M1_RELEASE_FROM_MANIFEST.md';

const fail = (message) => {
  console.error('FAIL: ' + message);
  process.exit(1);
};

if (!fs.existsSync(manifestPath)) fail('Manifest fehlt: ' + manifestPath);

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
} catch {
  fail('Manifest ist kein gueltiges JSON');
}

const req = (value, name) => {
  if (value === null || value === undefined || value === '') fail('Manifest-Feld fehlt/leer: ' + name);
  return value;
};

req(manifest.releaseId, '.releaseId');
req(manifest.schemaVersion, '.schemaVersion');
req(manifest.release?.frontend?.deployedSha, '.release.frontend.deployedSha');
req(manifest.release?.backend?.deployedSha, '.release.backend.deployedSha');
req(manifest.release?.backend?.renderDeployId, '.release.backend.renderDeployId');
req(manifest.release?.cloudflare?.versionId, '.release.cloudflare.versionId');
req(manifest.release?.productionE2E?.status, '.release.productionE2E.status');

const e2e = manifest.release.productionE2E;
const cf = manifest.release.cloudflare;
const human = manifest.release.humanGate;
const gov = manifest.release.governance;

const lines = [
  '# CRAFTFLOW M1 RELEASE EVIDENCE',
  '',
  '> GENERATED FILE — source of truth: release/release-manifest.json',
  '> Do not hand-edit release identity or gate state in this file.',
  '',
  '## Release identity',
  '',
  '- Release ID: `' + manifest.releaseId + '`',
  '- Schema: `' + manifest.schemaVersion + '`',
  '- Manifest status: `' + manifest.status + '`',
  '- Frontend deployed SHA: `' + manifest.release.frontend.deployedSha + '`',
  '- Frontend release commit: `' + (manifest.release.frontend.releaseCommit ?? 'OPEN') + '`',
  '- Backend deployed SHA: `' + manifest.release.backend.deployedSha + '`',
  '- Backend release commit: `' + (manifest.release.backend.releaseCommit ?? 'OPEN') + '`',
  '- Render deploy: `' + manifest.release.backend.renderDeployId + '`',
  '- Production domain: `' + manifest.release.frontend.productionDomain + '`',
  '- Cloudflare version: `' + cf.versionId + '`',
  '',
  '## Production E2E',
  '',
  '- Status: `' + e2e.status + '`',
  '- Run ID: `' + (e2e.runId ?? 'OPEN') + '`',
  '- Correlation ID: `' + (e2e.correlationId ?? 'OPEN') + '`',
  '- Job ID: `' + (e2e.jobId ?? 'OPEN') + '`',
  '- Approval version: `' + (e2e.approvalVersion ?? 'OPEN') + '`',
  '- n8n imported ID: `' + (e2e.n8nImportedId ?? 'OPEN') + '`',
  '- n8n execution ID: `' + (e2e.n8nExecutionId ?? 'OPEN') + '`',
  '- Drive status: `' + (e2e.driveStatus ?? 'OPEN') + '`',
  '- Persisted report matches: `' + (e2e.persistedReportMatches ?? 'OPEN') + '`',
  '- Cloudflare before E2E: `' + (cf.preE2EVersionId ?? 'OPEN') + '`',
  '- Cloudflare after E2E: `' + (cf.postE2EVersionId ?? 'OPEN') + '`',
  '',
  '## Human Gate',
  '',
  '- Status: `' + human.status + '`',
  '- Record: `' + (human.recordPath ?? 'OPEN') + '`',
  '- Record SHA256: `' + (human.sha256 ?? 'OPEN') + '`',
  '',
  '## Governance',
  '',
  '- ID: `' + gov.id + '`',
  '- Version: `' + gov.version + '`',
  '- Status: `' + gov.status + '`',
  '- Supersedes: `' + (gov.supersedes ?? 'none') + '`',
  '',
  '## Gates',
  '',
  ...Object.entries(manifest.gates || {}).map(([key, value]) => '- ' + key + ': `' + value + '`'),
  '',
  '## Evidence boundary',
  '',
  'This file is generated only from the manifest. It does not perform live Cloudflare, Render, n8n, Drive or GitHub verification.',
  'Those systems must write their verified results into the manifest before this evidence is generated.',
  ''
];

const body = lines.join('\n');
const dir = path.dirname(outputPath);
if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(outputPath, body, 'utf8');

const hash = crypto.createHash('sha256').update(body).digest('hex');
console.log('EVIDENCE_PATH=' + outputPath);
console.log('EVIDENCE_SHA256=' + hash);
