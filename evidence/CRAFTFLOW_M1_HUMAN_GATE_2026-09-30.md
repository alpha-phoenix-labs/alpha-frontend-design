# CRAFTFLOW M1 FORMAL HUMAN GATE

Gate ID: `CRAFTFLOW-M1-HUMAN-GATE-2026-09-30`
Decision: `APPROVED`
Decision time: `2026-09-30T00:47:58+02:00`
Approver: `BOSS / Product Owner (André Steffen)`
Decision signal: explicit `GO 3`

## Exact release identity

- Frontend deployed SHA: `8ca8c28d53c68a781af4710d24a8cd50373c1f6a`
- Backend deployed SHA: `60da25e02dd097a611058a206ed704022eb47c38`
- Backend Render deploy: `dep-dau23arrjlhs73cc13k0`
- Production domain: `https://control.vantarialabs.tech`
- Production Promotion run: `36640691870`
- Cloudflare production version: `16bc24fd-d784-4292-9ced-8057901b5489`
- Post-Deploy Production Gate run: `36640752286`
- Gate correlationId: `craftflow-m1-36640752286-1`
- Gate evidence artifact: `11066556636`
- Gate artifact digest: `sha256:c30edef4a98898468e1e39617c4e0575a22d15dc760819ae4e0635dcc7830882`
- Test target host: `control.vantarialabs.tech`

## Correlated production evidence

- Production E2E result: `PASS`
- Approval mode used inside automated E2E: `AUTOMATED_TEST_APPROVAL`
- Approval version: `11`
- Craftflow jobId: `cmun9dco4000713vmm204gj8l`
- n8n importedId: `B3AAGdSdABVK8oAC`
- n8n executionId: `29`
- Drive status: `COMPLETE`
- persistedReportMatches: `true`

## Human decision

BOSS approves the exact release identity above for completion of the M1 pre-tag release gate.

This human decision is separate from the automated test approval used by the Production E2E and satisfies the formal Human Gate for this exact release identity.

This decision does **not** authorize:
- creation of frontend or backend release tags;
- marking `coordinatedTags` PASS;
- marking `m1ProductionFreeze` PASS;
- any new merge, deploy, rerun, rollback, cleanup, or production-data deletion.

Those actions remain behind their own explicit BOSS GO.

## Evidence boundary

The decision applies only to the exact frontend/backend/deployment/E2E identities listed above. A later runtime or deployed-SHA change invalidates this correlation and requires a fresh Human Gate.
