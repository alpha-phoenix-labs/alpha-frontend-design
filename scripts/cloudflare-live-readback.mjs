#!/usr/bin/env node
const token=process.env.CLOUDFLARE_API_TOKEN?.trim();
const account=process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const worker=process.env.CLOUDFLARE_WORKER||'alpha-frontend-design';
const expected=(process.env.EXPECTED_CLOUDFLARE_VERSION||'').trim()||null;
if(!token||!account) throw new Error('CLOUDFLARE_READBACK_ENV_MISSING');
const base='https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(account)+'/workers/scripts/'+encodeURIComponent(worker);
async function get(path){const r=await fetch(base+path,{headers:{Authorization:'Bearer '+token,Accept:'application/json'}});const body=await r.json().catch(()=>null);if(!r.ok||body?.success!==true) throw new Error('CLOUDFLARE_READBACK_HTTP_'+r.status);return body;}
const deployments=await get('/deployments');
const raw=deployments.result;
const rows=Array.isArray(raw)?raw:(Array.isArray(raw?.deployments)?raw.deployments:[]);
if(!rows.length) throw new Error('CLOUDFLARE_DEPLOYMENTS_EMPTY');
const first=rows[0]||{};
let activeVersion=null;
if(Array.isArray(first.versions)){
  const hundred=first.versions.find(v=>Number(v?.percentage)===100&&typeof v?.version_id==='string');
  const any=first.versions.find(v=>typeof v?.version_id==='string');
  activeVersion=(hundred||any)?.version_id||null;
}
if(!activeVersion){for(const k of ['version_id','versionId','id']) if(typeof first?.[k]==='string'){activeVersion=first[k];break;}}
if(!activeVersion) throw new Error('CLOUDFLARE_ACTIVE_VERSION_NOT_FOUND');
const version=await get('/versions/'+encodeURIComponent(activeVersion));
const matchedExpected=expected?activeVersion===expected:true;
const out={readbackAt:new Date().toISOString(),worker,activeVersion,expectedVersion:expected,matchedExpected,versionExists:version?.result?.id===activeVersion};
console.log('CLOUDFLARE_LIVE_READBACK='+JSON.stringify(out));
if(!matchedExpected) throw new Error('CLOUDFLARE_EXPECTED_VERSION_MISMATCH');
