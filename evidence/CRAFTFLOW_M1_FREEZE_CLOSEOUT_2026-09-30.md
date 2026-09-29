# CRAFTFLOW M1 PRODUCTION FREEZE CLOSEOUT

Closeout ID: `CRAFTFLOW-M1-FREEZE-2026-09-30`
Release ID: `CRAFTFLOW-M1-1.0.0`
Closeout time: `2026-09-29T23:30:15Z`
Authorization: `BOSS — Freigabe bis Merge`
Result: `PASS`

## Release tags

- Frontend tag: `craftflow-m1-frontend-v1.0.0`
- Frontend tag target: `8ca8c28d53c68a781af4710d24a8cd50373c1f6a`
- Frontend release ID: `399595986`
- Frontend prerelease: `false`
- Backend tag: `craftflow-m1-backend-v1.0.0`
- Backend tag target: `60da25e02dd097a611058a206ed704022eb47c38`
- Backend release ID: `399596890`
- Backend prerelease: `false`

Both tag refs were read back from GitHub after publication and point directly to the exact deployed release commits.

## Production identity / drift check

- Frontend deployed SHA: `8ca8c28d53c68a781af4710d24a8cd50373c1f6a`
- Frontend evidence-only main SHA before this closeout: `5846356d9d2c3e21b64672a495858718d3669cc5`
- Binding Production Promotion run: `36640691870` — `SUCCESS`
- Binding Cloudflare version: `16bc24fd-d784-4292-9ced-8057901b5489`
- Binding Post-Deploy Production Gate run: `36640752286` — `SUCCESS`
- Backend main SHA: `60da25e02dd097a611058a206ed704022eb47c38`
- Render LIVE deploy: `dep-dau23arrjlhs73cc13k0`
- Render LIVE commit: `60da25e02dd097a611058a206ed704022eb47c38`

Fresh GitHub Actions inspection found no later successful Production Promotion after the binding release. Later evidence-only main changes produced CI / Cloudflare Deploy Test runs and skipped Production Promotion / Post-Deploy Production Gate where applicable. The release tags themselves produced no later workflow run.

The Cloudflare direct LIVE readback is the release-defining PASS captured by the binding Post-Deploy Production Gate; this closeout does not re-run Production E2E or mutate Production.

## Correlated release evidence

- Production E2E: `PASS`
- Correlation ID: `craftflow-m1-36640752286-1`
- Production target host: `control.vantarialabs.tech`
- Job ID: `cmun9dco4000713vmm204gj8l`
- n8n imported workflow: `B3AAGdSdABVK8oAC`
- n8n execution: `29`
- Drive status: `COMPLETE`
- Persisted TestReport match: `true`
- Formal Human Gate: `PASS`
- Governance: `M1-GOV-001 v1.1.0` — `APPROVED`

## Final gate decision

- `coordinatedTags`: `PASS`
- `m1ProductionFreeze`: `PASS`
- Manifest status: `PASS`

This closeout freezes the exact M1 release identity above. Any later change to the deployed frontend SHA, backend SHA, active Cloudflare production version, runtime backend pin, or release tags is outside this freeze and requires a new release correlation.

## Evidence boundary

This closeout records and correlates the verified release sources available at closeout time. It does not delete test data, rerun Production E2E, deploy code, or alter the already-tagged release commits.
