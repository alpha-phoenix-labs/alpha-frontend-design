#!/usr/bin/env node
const target=(process.env.N8N_TEST_INSTANCE_URL||'https://adaptable-gibbon.pikapod.net').replace(/\/$/,'');
const attempts=Number(process.env.N8N_PREFLIGHT_ATTEMPTS||3);
const delays=[0,2000,5000,10000];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function probe(path){const res=await fetch(target+path,{redirect:'manual'});const ct=(res.headers.get('content-type')||'').toLowerCase();return {path,status:res.status,contentType:ct};}
for(let i=0;i<attempts;i++){
  if(delays[i]) await sleep(delays[i]);
  try{
    const health=await probe('/healthz');
    const api=await probe('/api/v1/workflows');
    console.log(JSON.stringify({attempt:i+1,health,api}));
    if(health.status===200 && (api.status===401||api.status===403||api.status===200)){console.log('N8N_PREFLIGHT=PASS');process.exit(0);}
    const upstream=[health,api].some(x=>x.status===502&&x.contentType.includes('text/html'));
    if(upstream) console.error('::warning::EXTERNAL_DEPENDENCY_PIKAPODS 502 text/html. Runbook: docs/runbooks/pikapods-outage.md');
  }catch(error){console.error('::warning::N8N_PREFLIGHT_NETWORK '+(error instanceof Error?error.message:'UNKNOWN'));}
}
console.error('::error::N8N_PREFLIGHT=BLOCKED_EXTERNAL');
process.exit(2);
