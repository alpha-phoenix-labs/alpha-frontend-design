# CRAFTFLOW M1 RELEASE MANIFEST

Release ID: `CRAFTFLOW-M1-1.0.0`  
Manifest status: `DRAFT / NOT FINAL`  
Prepared: 2026-09-29  
Scope: M1 production release correlation only.

> This manifest records already observed production evidence. It does not resolve the pending governance baseline, does not create a release tag, and does not constitute final M1 approval.

## 1. Release identity

| Field | Value | Status |
|---|---|---|
| Frontend repository | `alpha-phoenix-labs/alpha-frontend-design` | PASS |
| Frontend main / production SHA | `8ca8c28d53c68a781af4710d24a8cd50373c1f6a` | PASS |
| Production domain | `https://control.vantarialabs.tech` | PASS |
| Backend repository | `alpha-phoenix-labs/n8n-workflow-factory` | PASS |
| Backend main / Render LIVE SHA | `60da25e02dd097a611058a206ed704022eb47c38` | PASS |
| Frontend runtime backend pin | `60da25e02dd097a611058a206ed704022eb47c38` | PASS |
| Backend production URL | `https://n8n-workflow-factory.onrender.com` | PASS |
| Governance baseline ID/version | `M1-GOV-001 v1.1.0` | PASS |
| Frontend release tag | not created | OPEN |
| Backend release tag | not created | OPEN |

## 2. Deployment correlation

| Field | Value | Status |
|---|---|---|
| Frontend Production Promotion run | `36640691870` | PASS |
| Promotion target SHA | `8ca8c28d53c68a781af4710d24a8cd50373c1f6a` | PASS |
| Backend Render service | `srv-daqk0sp7lnhs73d9nr7g` | PASS |
| Backend Render deploy | `dep-dau23arrjlhs73cc13k0` | PASS |
| Backend deploy SHA | `60da25e02dd097a611058a206ed704022eb47c38` | PASS |
| Cloudflare production version | `16bc24fd-d784-4292-9ced-8057901b5489` | PASS
| Post-Deploy Production Gate run | `36640752286` | PASS
| Gate evidence artifact | `11066556636` / `sha256:c30edef4a98898468e1e39617c4e0575a22d15dc760819ae4e0635dcc7830882` | PASS |

## 3. Production E2E correlation

Release-defining Post-Deploy Production Gate: `36640752286`.

### Final release-defining production gate

- Frontend deployed SHA: `8ca8c28d53c68a781af4710d24a8cd50373c1f6a`
- Test target host: `control.vantarialabs.tech`
- Promotion run: `36640691870`
- Cloudflare before == after == promoted: `16bc24fd-d784-4292-9ced-8057901b5489`
- correlationId: `craftflow-m1-36640752286-1`
- approval mode: `AUTOMATED_TEST_APPROVAL`
- Craftflow jobId: `cmun9dco4000713vmm204gj8l`
- n8n importedId: `B3AAGdSdABVK8oAC`
- n8n executionId: `29`
- Drive status: `COMPLETE`
- Auftrag: `1fYmblUkGSvAv8JIZQgDs_Zipl5limeYc`
- Workflow: `12dJXptGiyduoYHlR2kJslwqKQXJ2fhoH`
- TestReport: `1mkYMokiZ4s8YqPrNp-f6de1Wf6mellhY`
- Final Workflow: `14dVeezbqO9Ao43i3Mb9erGnJPj0MwLIX`
- Documentation: `1Qqk3wryoht2H2pJc33XZQMMKTS0jhDYf`
- persistedReportMatches: `true`
- Evidence artifact: `11066556636`
- Artifact digest: `sha256:c30edef4a98898468e1e39617c4e0575a22d15dc760819ae4e0635dcc7830882`
- Result: `PASS`

### Historical precursor stability evidence

The earlier Actions run `36500003753` and its attempts below are retained as precursor stability evidence. They are not the release-defining final gate for frontend SHA `8ca8c28d53c68a781af4710d24a8cd50373c1f6a`.

The temporary runner branch `test/production-e2e-3d4c0f-20260929` was only used to execute the production-domain validation and was subsequently isolated to manual-only execution. It is not a production deployment source.

### Attempt 1 — baseline

- Actions job: `109188333569`
- Craftflow jobId: `cmulwh3nb0001xsccndho402e`
- submittedStatus: `WAITING_FOR_APPROVAL`
- approvalVersion: `11`
- n8n importedId: `qqIKS7MbuaZbBQ9n`
- n8n executionId: `21`
- completed: `true`
- Drive status: `COMPLETE`
- Auftrag: `1npSOOl83EKBGZabsY0_wBSg74t3nR3wq`
- Workflow: `1jBO0C-Z10gZ5faCwUeeM1bzcKsHYWa5v`
- TestReport: `1WQkA_yluObvk8p3cxkHxioUbFyWFA2Dd`
- Final Workflow: `1LkJSWcwt0ESksXq5WWv9rmteNwPCTWuB`
- Documentation: `1SE7v_VrgtxlBLFae5-9XBJVkcUkO7zK7`
- persistedReportMatches: `true`
- Result: `PASS`

### Attempt 2 — stability 1/3

- Actions job: `109189711752`
- Craftflow jobId: `cmulwnkjt0002xscc1hc4a5t2`
- n8n importedId: `bBfZCFELgcHkSTFF`
- n8n executionId: `22`
- completed: `true`
- Drive status: `COMPLETE`
- Auftrag: `1i-Zc04eiYTELujOpK1nmJHBhuiZvbf1y`
- Workflow: `1YQ-v7CTAdWfG9T8HJeiHs9po18h0WXx9`
- TestReport: `1jyNi8nNtp7XseqWzXgeNaxmVXIfE9OCc`
- Final Workflow: `1ruzOVN50lJ7EYHoxgUc9czK016ASMjC5`
- Documentation: `1gnlzldoxZzKHIMHNuAx8Kj87OiwQI81q`
- persistedReportMatches: `true`
- Result: `PASS`

### Attempt 3 — stability 2/3

- Actions job: `109190097810`
- Craftflow jobId: `cmulwpe1b0003xscckkfy880h`
- n8n importedId: `iZOuDOeXqXdAGKj9`
- n8n executionId: `23`
- completed: `true`
- Drive status: `COMPLETE`
- Auftrag: `15S9BsT3o9WIdW-hq0pkCE7rRWZgYlNn1`
- Workflow: `1MtgyQBf6yfixC8fKW2pLZ-oDgYpLQ89m`
- TestReport: `1E9eG8W3JzEeS1HKDP9EdmCb54Qwbo5ec`
- Final Workflow: `1zi7q5IwboyymQuU2c-FczEZVu6mApLdb`
- Documentation: `1wSVFrSb3Cg-aE7CgEKIdgwJXUdhSHGmD`
- persistedReportMatches: `true`
- Result: `PASS`

### Attempt 4 — stability 3/3

- Actions job: `109190639878`
- Craftflow jobId: `cmulwry8x0004xsccaofpjzhu`
- n8n importedId: `A11gX6i1Nh7ISN06`
- n8n executionId: `24`
- completed: `true`
- Drive status: `COMPLETE`
- Auftrag: `1LMNqsL6EF1B00G9HdgDJ5dtv5BENsVv7`
- Workflow: `1fBIDNoKDxPjAulYQJEZOem4caE9SCDwB`
- TestReport: `1zl8h9Mrzl3UYqwvbyzGNggj-QG2xesJF`
- Final Workflow: `1GSfeNWRGBhBxVYfPwRfA3EG1M-sLVyjn`
- Documentation: `1YM-eoVyyss3YIJjX98AG0eNsa_V2ZeF9`
- persistedReportMatches: `true`
- Result: `PASS`

## 4. Current correlated result

| Gate | Result |
|---|---|
| Production frontend release identity | PASS |
| Production backend release identity | PASS |
| Runtime backend pin | PASS |
| Production promotion | PASS |
| Production-domain E2E | PASS |
| n8n import / activation / execution evidence | PASS |
| WAITING_FOR_APPROVAL reached | PASS |
| Final completion | PASS |
| Drive COMPLETE | PASS |
| Persisted backend TestReport matches archived TestReport | PASS |
| Three additional consecutive production runs to Drive | 3/3 PASS |
| Approved governance baseline | PASS |
| Cloudflare production version and direct readback | PASS |
| Formal final Human Gate evidence record | NOT_PROVEN |
| Release tags | OPEN |
| M1 Production Freeze | BLOCKED |

## 5. Required completion before final release

The following items are intentionally not asserted as complete by this draft manifest:

1. Freeze the formal Human Gate evidence record, including reviewer/actor and timing fields required by the approved audit baseline.
2. Confirm no later unverified production deployment superseded the release identity recorded here.
3. Generate/freeze the canonical evidence pack and its SHA256 from the final manifest state.
4. After all pre-tag release gates pass, create the coordinated frontend and backend release tags under explicit Human Gate approval.

## 6. Release tag plan — not executed

Planned only; no tag is created by this manifest:

- Frontend: `craftflow-m1-frontend-v1.0.0` → `8ca8c28d53c68a781af4710d24a8cd50373c1f6a`
- Backend: `craftflow-m1-backend-v1.0.0` → `60da25e02dd097a611058a206ed704022eb47c38`

## 7. Evidence source

Detailed per-run evidence remains frozen in:

`evidence/M1_PRODUCTION_EVIDENCE_2026-09-29.md`

This manifest is a correlation document. Where evidence is absent or governance is unresolved, the status remains `NOT_PROVEN`, `OPEN`, or `BLOCKED`; it is never upgraded to PASS by inference.
