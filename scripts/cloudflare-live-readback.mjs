#!/usr/bin/env node
const token=process.env.CLOUDFLARE_API_TOKEN?.trim();
const account=process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const worker=process.env.CLOUDFLARE_WORKER||'alpha-frontend-design';
const expected=process.env.EXPECTED_CLOUDFLARE_VERSION?.trim();
if(!token||!account||!expected) throw new Error('CLOUDFLARE_READBACK_ENV_MISSING');
const base='https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(account)+'/workers/scripts/'+encodeURIComponent(worker);
async function get(path){const r=await fetch(base+path,{headers:{Authorization:'Bearer '+token,Accept:'application/json'}});const body=await r.json().catch(()=>null);if(!r.ok||body?.success!==true) throw new Error('CLOUDFLARE_READBACK_HTTP_'+r.status);return body;}
const deployments=await get('/deployments');
const version=await get('/versions/'+encodeURIComponent(expected));
const raw=deployments.result;
const rows=Array.isArray(raw)?raw:(Array.isArray(raw?.deployments)?raw.deployments:[]);
const ids=new Set();
for(const d of rows){for(const k of ['version_id','versionId','id']) if(typeof d?.[k]==='string') ids.add(d[k]); if(Array.isArray(d?.versions)) for(const v of d.versions) if(typeof v?.version_id==='string') ids.add(v.version_id);}
const matched=ids.has(expected)||version?.result?.id===expected;
const out={readbackAt:new Date().toISOString(),worker,expectedVersion:expected,versionExists:version?.result?.id===expected,deploymentReferencesExpectedVersion:ids.has(expected),matched};
console.log('CLOUDFLARE_LIVE_READBACK='+JSON.stringify(out));
if(!matched) throw new Error('CLOUDFLARE_EXPECTED_VERSION_NOT_CORRELATED');
