import {pathToFileURL} from 'node:url';
export const REQUIRED = Object.freeze([
  ['ci.yml', 'build'],
  ['cloudflare-deploy-test.yml', 'deploy-test'],
  ['real-e2e.yml', 'real-e2e'],
]);
const fail = () => { throw new Error('FAIL — POST-MERGE TRUTH MISSING'); };
const isAllowedSkippedJob = (file, job) =>
  file === 'real-e2e.yml' &&
  job.name === 'real-e2e-contract' &&
  job.status === 'completed' &&
  job.conclusion === 'skipped';
export async function verifyPromotion({get, repository, sha, ref}) {
  if (repository !== 'alpha-phoenix-labs/alpha-frontend-design' || !/^[a-f0-9]{40}$/.test(sha ?? '') || ref !== 'refs/heads/main') fail();
  const base = '/repos/' + repository;
  const isMain = async () => { if ((await get(base + '/git/ref/heads/main')).object?.sha !== sha) fail(); };
  await isMain();
  const evidence = [];
  for (const [file, jobName] of REQUIRED) {
    const workflow = await get(base + '/actions/workflows/' + file);
    if (workflow.path !== '.github/workflows/' + file || workflow.state !== 'active') fail();
    const data = await get(base + '/actions/workflows/' + workflow.id + '/runs?branch=main&event=push&head_sha=' + sha + '&per_page=100');
    if (!Array.isArray(data.workflow_runs) || !Number.isInteger(data.total_count) || data.total_count > 100 || !data.workflow_runs.length) fail();
    // Latest run only: an older success never overrides a newer failure/cancellation.
    const run = [...data.workflow_runs].sort((a,b) => b.run_number - a.run_number || b.id - a.id)[0];
    if (run.workflow_id !== workflow.id || run.event !== 'push' || run.head_branch !== 'main' || run.head_sha !== sha || run.head_repository?.full_name !== repository || run.status !== 'completed' || run.conclusion !== 'success') fail();
    const jobs = await get(base + '/actions/runs/' + run.id + '/jobs?filter=latest&per_page=100');
    if (!Array.isArray(jobs.jobs) || !Number.isInteger(jobs.total_count) || jobs.total_count > 100) fail();
    const requiredJobs = jobs.jobs.filter(job => job.name === jobName);
    if (requiredJobs.length !== 1 || requiredJobs[0].status !== 'completed' || requiredJobs[0].conclusion !== 'success') fail();
    if (jobs.jobs.some(job => job.status !== 'completed' || (job.conclusion !== 'success' && !isAllowedSkippedJob(file, job)))) fail();
    evidence.push({workflow: file, runId: run.id, sha});
  }
  await isMain();
  return evidence;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (!process.env.GITHUB_TOKEN) fail();
    const get = async path => {
      const response = await fetch('https://api.github.com' + path, {
        headers: {Authorization: 'Bearer ' + process.env.GITHUB_TOKEN, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'},
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) fail();
      return response.json();
    };
    const evidence = await verifyPromotion({get, repository: process.env.GITHUB_REPOSITORY, sha: process.env.GITHUB_SHA, ref: process.env.GITHUB_REF});
    console.log(JSON.stringify({status: 'POST_MERGE_TRUTH_PASS', evidence}));
  } catch {
    console.error('::error::FAIL — POST-MERGE TRUTH MISSING');
    process.exitCode = 1;
  }
}
