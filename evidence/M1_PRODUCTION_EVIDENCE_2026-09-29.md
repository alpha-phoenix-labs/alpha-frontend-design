# HANDWERKERFLOW / CRAFTFLOW — M1 Production Evidence Pack

Frozen: 2026-09-29
Scope: production release evidence only. No release tag or M1 final approval is implied by this document.

## Release identity

- Frontend repository: alpha-phoenix-labs/alpha-frontend-design
- Frontend main / production SHA: `8ca8c28d53c68a781af4710d24a8cd50373c1f6a`
- Production domain: `https://control.vantarialabs.tech`
- Production Promotion run: `36640691870` — SUCCESS
- Cloudflare production version: `16bc24fd-d784-4292-9ced-8057901b5489`
- Post-Deploy Production Gate: `36640752286` — SUCCESS
- Backend repository: alpha-phoenix-labs/n8n-workflow-factory
- Backend main / Render LIVE SHA: `60da25e02dd097a611058a206ed704022eb47c38`
- Render production deploy: `dep-dau23arrjlhs73cc13k0` — LIVE
- Backend production URL: `https://api.vantarialabs.tech`
- Frontend runtime truth pin references backend SHA `60da25e02dd097a611058a206ed704022eb47c38`.

## Production E2E evidence

### Final release-defining Post-Deploy gate

- Run: `36640752286`
- Promotion run: `36640691870`
- Frontend SHA: `8ca8c28d53c68a781af4710d24a8cd50373c1f6a`
- Test target host: `control.vantarialabs.tech`
- Cloudflare before == after == promoted: `16bc24fd-d784-4292-9ced-8057901b5489`
- correlationId: `craftflow-m1-36640752286-1`
- approval mode: `AUTOMATED_TEST_APPROVAL`
- Craftflow jobId: `cmun9dco4000713vmm204gj8l`
- n8n imported workflowId: `B3AAGdSdABVK8oAC`
- n8n executionId: `29`
- Drive status: `COMPLETE`
- persistedReportMatches: `true`
- Auftrag fileId: `1fYmblUkGSvAv8JIZQgDs_Zipl5limeYc`
- Workflow fileId: `12dJXptGiyduoYHlR2kJslwqKQXJ2fhoH`
- TestReport fileId: `1mkYMokiZ4s8YqPrNp-f6de1Wf6mellhY`
- Final Workflow fileId: `14dVeezbqO9Ao43i3Mb9erGnJPj0MwLIX`
- Documentation fileId: `1Qqk3wryoht2H2pJc33XZQMMKTS0jhDYf`
- Evidence artifact: `11066556636`
- Artifact digest: `sha256:c30edef4a98898468e1e39617c4e0575a22d15dc760819ae4e0635dcc7830882`
- Result: PASS

### Historical precursor stability evidence

The earlier production runs below are retained as precursor stability evidence for earlier frontend identity `3d4c0f837f2b9bc9f49eabb1cfadbda503d1b3c1`. They do not replace the final release-defining gate above.

The GitHub Actions runner itself lived temporarily on branch `test/production-e2e-3d4c0f-20260929`; its job checked out the exact production frontend SHA before executing the browser test. The temporary branch was later isolated to manual-only execution. It was not a production deployment source.

### Baseline production run

- Actions run: `36500003753`, attempt 1
- Actions job: `109188333569`
- Craftflow jobId: `cmulwh3nb0001xsccndho402e`
- submittedStatus: `WAITING_FOR_APPROVAL`
- approvalVersion: `11`
- n8n pass: `true`
- n8n executionId: `21`
- n8n imported workflowId: `qqIKS7MbuaZbBQ9n`
- completed: `true`
- Drive status: `COMPLETE`
- Auftrag fileId: `1npSOOl83EKBGZabsY0_wBSg74t3nR3wq`
- Workflow fileId: `1jBO0C-Z10gZ5faCwUeeM1bzcKsHYWa5v`
- TestReport fileId: `1WQkA_yluObvk8p3cxkHxioUbFyWFA2Dd`
- Final Workflow fileId: `1LkJSWcwt0ESksXq5WWv9rmteNwPCTWuB`
- Documentation fileId: `1SE7v_VrgtxlBLFae5-9XBJVkcUkO7zK7`
- persistedReportMatches: `true`
- Result: PASS

### Consecutive stability run 1/3

- Actions run: `36500003753`, attempt 2
- Actions job: `109189711752`
- Craftflow jobId: `cmulwnkjt0002xscc1hc4a5t2`
- n8n executionId: `22`
- n8n imported workflowId: `bBfZCFELgcHkSTFF`
- completed: `true`
- Drive status: `COMPLETE`
- Auftrag fileId: `1i-Zc04eiYTELujOpK1nmJHBhuiZvbf1y`
- Workflow fileId: `1YQ-v7CTAdWfG9T8HJeiHs9po18h0WXx9`
- TestReport fileId: `1jyNi8nNtp7XseqWzXgeNaxmVXIfE9OCc`
- Final Workflow fileId: `1ruzOVN50lJ7EYHoxgUc9czK016ASMjC5`
- Documentation fileId: `1gnlzldoxZzKHIMHNuAx8Kj87OiwQI81q`
- persistedReportMatches: `true`
- Result: PASS

### Consecutive stability run 2/3

- Actions run: `36500003753`, attempt 3
- Actions job: `109190097810`
- Craftflow jobId: `cmulwpe1b0003xscckkfy880h`
- n8n executionId: `23`
- n8n imported workflowId: `iZOuDOeXqXdAGKj9`
- completed: `true`
- Drive status: `COMPLETE`
- Auftrag fileId: `15S9BsT3o9WIdW-hq0pkCE7rRWZgYlNn1`
- Workflow fileId: `1MtgyQBf6yfixC8fKW2pLZ-oDgYpLQ89m`
- TestReport fileId: `1E9eG8W3JzEeS1HKDP9EdmCb54Qwbo5ec`
- Final Workflow fileId: `1zi7q5IwboyymQuU2c-FczEZVu6mApLdb`
- Documentation fileId: `1wSVFrSb3Cg-aE7CgEKIdgwJXUdhSHGmD`
- persistedReportMatches: `true`
- Result: PASS

### Consecutive stability run 3/3

- Actions run: `36500003753`, attempt 4
- Actions job: `109190639878`
- Craftflow jobId: `cmulwry8x0004xsccaofpjzhu`
- n8n executionId: `24`
- n8n imported workflowId: `A11gX6i1Nh7ISN06`
- completed: `true`
- Drive status: `COMPLETE`
- Auftrag fileId: `1LMNqsL6EF1B00G9HdgDJ5dtv5BENsVv7`
- Workflow fileId: `1fBIDNoKDxPjAulYQJEZOem4caE9SCDwB`
- TestReport fileId: `1zl8h9Mrzl3UYqwvbyzGNggj-QG2xesJF`
- Final Workflow fileId: `1GSfeNWRGBhBxVYfPwRfA3EG1M-sLVyjn`
- Documentation fileId: `1YM-eoVyyss3YIJjX98AG0eNsa_V2ZeF9`
- persistedReportMatches: `true`
- Result: PASS

## Correlated outcome

For the exact release identity above:
- Production UI path: PASS
- Production backend identity: PASS
- n8n import/activation/webhook/execution path: PASS
- Approval state reached: PASS
- Finalization completed: PASS
- Google Drive archive: PASS
- Persisted backend TestReport vs Drive TestReport: PASS
- Three consecutive additional production runs through Drive COMPLETE: 3/3 PASS

## Evidence boundaries / still separate gates

Governance baseline `M1-GOV-001 v1.1.0` is correlated to the current release identity. The remaining separate gates are:
1. Formal Human Gate record for the exact final release identity.
2. Canonical evidence-pack SHA256 after the Human Gate is recorded.
3. Coordinated release tags under explicit BOSS approval.
4. Final M1 Production Freeze closure.

Missing evidence for any remaining item stays NOT_PROVEN / OPEN / BLOCKED and is never converted into PASS by inference.
