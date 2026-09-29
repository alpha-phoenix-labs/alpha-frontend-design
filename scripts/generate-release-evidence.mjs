#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';
const path=process.argv[2]||'release/release-manifest.json';
const out=process.argv[3]||'evidence/M1_RELEASE_FROM_MANIFEST.md';
const manifest=JSON.parse(fs.readFileSync(path,'utf8'));
const r=manifest.release;
for(const k of ['releaseId','status','release']) if(manifest[k]===undefined) throw new Error('MANIFEST_MISSING_'+k);
const lines=[
  '# CRAFTFLOW M1 RELEASE EVIDENCE','',
  'Generated from release/release-manifest.json. Do not hand-edit release identity here.','',
  '## Release identity','',
  '- Release: `'+manifest.releaseId+'`',
  '- Status: `'+manifest.status+'`',
  '- Frontend SHA: `'+r.frontend.sha+'`',
  '- Backend SHA: `'+r.backend.sha+'`',
  '- Render deploy: `'+r.backend.renderDeployId+'`',
  '- Production domain: `'+r.frontend.productionDomain+'`',
  '- Cloudflare version: `'+r.cloudflare.versionId+'`',
  '- Production E2E run: `'+(r.productionE2E.runId??'NOT_PROVEN')+'`',
  '- Craftflow jobId: `'+(r.productionE2E.jobId??'NOT_PROVEN')+'`',
  '- n8n executionId: `'+(r.productionE2E.n8nExecutionId??'NOT_PROVEN')+'`',
  '- Drive status: `'+(r.productionE2E.driveStatus??'NOT_PROVEN')+'`',
  '- Human Gate: `'+r.humanGate.status+'`',
  '- Governance: `'+r.governance.id+' v'+r.governance.version+'`','',
  '## Gates','',
  ...Object.entries(manifest.gates).map(([k,v])=>'- '+k+': `'+v+'`'),
  ''
];
const body=lines.join('\n');
fs.mkdirSync(out.split('/').slice(0,-1).join('/'),{recursive:true});
fs.writeFileSync(out,body);
console.log('EVIDENCE_SHA256='+crypto.createHash('sha256').update(body).digest('hex'));
