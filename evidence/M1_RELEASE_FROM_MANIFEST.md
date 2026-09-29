# CRAFTFLOW M1 RELEASE EVIDENCE

> GENERATED FILE — source of truth: release/release-manifest.json
> Do not hand-edit release identity or gate state in this file.

## Release identity

- Release ID: `CRAFTFLOW-M1-1.0.0`
- Schema: `1.1.0`
- Manifest status: `PASS`
- Frontend deployed SHA: `8ca8c28d53c68a781af4710d24a8cd50373c1f6a`
- Frontend release commit: `OPEN`
- Backend deployed SHA: `60da25e02dd097a611058a206ed704022eb47c38`
- Backend release commit: `OPEN`
- Render deploy: `dep-dau23arrjlhs73cc13k0`
- Production domain: `https://control.vantarialabs.tech`
- Cloudflare version: `16bc24fd-d784-4292-9ced-8057901b5489`

## Production E2E

- Status: `PASS`
- Run ID: `36640752286`
- Correlation ID: `craftflow-m1-36640752286-1`
- Job ID: `cmun9dco4000713vmm204gj8l`
- Approval version: `11`
- n8n imported ID: `B3AAGdSdABVK8oAC`
- n8n execution ID: `29`
- Drive status: `COMPLETE`
- Persisted report matches: `true`
- Cloudflare before E2E: `16bc24fd-d784-4292-9ced-8057901b5489`
- Cloudflare after E2E: `16bc24fd-d784-4292-9ced-8057901b5489`

## Human Gate

- Status: `PASS`
- Record: `evidence/CRAFTFLOW_M1_HUMAN_GATE_2026-09-30.md`
- Record SHA256: `6a6deaa02e583274c21554f68637227536adc72daf49a738d525daae22853995`

## Governance

- ID: `M1-GOV-001`
- Version: `1.1.0`
- Status: `APPROVED`
- Supersedes: `1.0.0`

## Gates

- frontendMain: `PASS`
- backendMainRenderLive: `PASS`
- runtimePin: `PASS`
- productionPromotion: `PASS`
- postDeployProductionGate: `PASS`
- productionDomainE2E: `PASS`
- cloudflareDirectLiveReadback: `PASS`
- formalHumanGate: `PASS`
- evidencePack: `PASS`
- coordinatedTags: `PASS`
- m1ProductionFreeze: `PASS`

## Evidence boundary

This file is generated only from the manifest. It does not perform live Cloudflare, Render, n8n, Drive or GitHub verification.
Those systems must write their verified results into the manifest before this evidence is generated.
