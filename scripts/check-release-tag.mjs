#!/usr/bin/env node
import fs from 'node:fs';
const m=JSON.parse(fs.readFileSync(process.argv[2]||'release/release-manifest.json','utf8'));
if(m.status!=='PASS'||m.gates?.m1ProductionFreeze!=='PASS') throw new Error('MANIFEST_NOT_RELEASE_READY');
if(!m.release?.frontend?.sha||!m.release?.backend?.sha) throw new Error('MANIFEST_SHA_MISSING');
const kind=process.env.RELEASE_TAG_KIND;
const target=process.env.RELEASE_TAG_TARGET_SHA;
if(kind==='frontend'&&target!==m.release.frontend.sha) throw new Error('TAG_TARGET_FRONTEND_SHA_MISMATCH');
if(kind==='backend'&&target!==m.release.backend.sha) throw new Error('TAG_TARGET_BACKEND_SHA_MISMATCH');
if(!['frontend','backend'].includes(kind||'')) throw new Error('RELEASE_TAG_KIND_INVALID');
console.log('TAG_MANIFEST_CHECK=PASS');
