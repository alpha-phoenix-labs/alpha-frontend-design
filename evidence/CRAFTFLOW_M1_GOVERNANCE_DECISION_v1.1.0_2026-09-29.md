# CRAFTFLOW M1 GOVERNANCE DECISION

Governance ID: `M1-GOV-001`  
Version: `1.1.0`  
Status: `APPROVED / BINDING FOR CURRENT M1 RELEASE`  
Approver: `BOSS / Product Owner`  
Supersedes: `1.0.0`

## Binding release identity

- Frontend: `8ca8c28d53c68a781af4710d24a8cd50373c1f6a`
- Backend: `60da25e02dd097a611058a206ed704022eb47c38`
- Backend Render deploy: `dep-dau23arrjlhs73cc13k0`
- Frontend runtime backend pin: `60da25e02dd097a611058a206ed704022eb47c38`
- Production domain: `https://control.vantarialabs.tech`
- Production Promotion run: `36640691870`
- Cloudflare production version: `16bc24fd-d784-4292-9ced-8057901b5489`
- Post-Deploy Production Gate run: `36640752286`
- Gate correlationId: `craftflow-m1-36640752286-1`
- Evidence artifact: `11066556636` / `sha256:c30edef4a98898468e1e39617c4e0575a22d15dc760819ae4e0635dcc7830882`

## Decision

The controlled isolated n8n execution before approval remains `PRE-APPROVAL VALIDATION`.
It is technical validation only and never substitutes for Human Approval.

The binding sequence is:

Production deploy -> direct Cloudflare LIVE identity readback -> Production-domain E2E -> WAITING_FOR_APPROVAL -> HUMAN GATE -> finalization -> Drive COMPLETE -> evidence generation -> release decision -> tags.

A Preview E2E does not satisfy the final Production-domain gate.

## Human Gate

The final Human Gate must decide on the exact release identity and correlated E2E result recorded in `release/release-manifest.json`.
Automated approvals, synthetic approvals, or test API tokens must be recorded separately and do not satisfy the Human Gate.

## Change control

Any change to frontend SHA, backend SHA, active Cloudflare production version, Human Gate position, or PRE-APPROVAL VALIDATION classification requires a new governance version or explicit release re-correlation.
