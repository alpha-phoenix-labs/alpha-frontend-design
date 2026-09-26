import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyPromotion, REQUIRED} from './promotion-gate.mjs';
const sha = 'a'.repeat(40), repository = 'alpha-phoenix-labs/alpha-frontend-design';
function fixture(mutate = () => {}) {
  let reads = 0;
  return async path => {
    let data;
    if(path.endsWith('/git/ref/heads/main')) data = {object:{sha}, read:++reads};
    else if(path.includes('/jobs?')) data = {total_count:1,jobs:[{name:REQUIRED[Number(path.match(/runs\/(\d+)/)[1])-10][1],status:'completed',conclusion:'success'}]};
    else if(path.includes('/runs?')) {
      const id = Number(path.match(/workflows\/(\d+)/)[1]);
      data = {total_count:1,workflow_runs:[{id:id+10,run_number:1,workflow_id:id,event:'push',head_branch:'main',head_sha:sha,head_repository:{full_name:repository},status:'completed',conclusion:'success'}]};
    } else {
      const file=path.split('/').at(-1), id=REQUIRED.findIndex(x=>x[0]===file);
      data={id,path:'.github/workflows/'+file,state:'active'};
    }
    mutate(data,path); return data;
  };
}
const run = get => verifyPromotion({get,repository,sha,ref:'refs/heads/main'});
test('exact main SHA with all automatic evidence succeeds', async()=>assert.equal((await run(fixture())).length,3));
for(const [name,field,value] of [['other SHA','head_sha','b'.repeat(40)],['PR run','event','pull_request'],['manual run','event','workflow_dispatch'],['failed run','conclusion','failure'],['cancelled run','conclusion','cancelled'],['pending run','status','in_progress'],['foreign repository','head_repository',{full_name:'other/repo'}]]) {
 test(name+' blocks promotion',async()=>assert.rejects(run(fixture(d=>{if(d.workflow_runs)d.workflow_runs[0][field]=value;}))));
}
test('missing E2E workflow blocks promotion',async()=>assert.rejects(run(fixture((d,p)=>{if(p.endsWith('real-e2e.yml'))throw Error('404');}))));
test('missing run blocks promotion',async()=>assert.rejects(run(fixture(d=>{if(d.workflow_runs)d.workflow_runs=[];}))));
test('latest failed run defeats older success',async()=>assert.rejects(run(fixture(d=>{if(d.workflow_runs)d.workflow_runs.push({...d.workflow_runs[0],id:99,run_number:2,conclusion:'failure'});}))));
test('skipped required job blocks promotion',async()=>assert.rejects(run(fixture(d=>{if(d.jobs)d.jobs[0].conclusion='skipped';}))));
test('missing job blocks promotion',async()=>assert.rejects(run(fixture(d=>{if(d.jobs)d.jobs=[];}))));
test('main moving during verification blocks promotion',async()=>assert.rejects(run(fixture(d=>{if(d.read===2)d.object.sha='b'.repeat(40);}))));
test('API failure blocks promotion',async()=>assert.rejects(run(async()=>{throw Error('403');})));
test('non-main dispatch blocks promotion',async()=>assert.rejects(verifyPromotion({get:fixture(),repository,sha,ref:'refs/heads/audit'})));
