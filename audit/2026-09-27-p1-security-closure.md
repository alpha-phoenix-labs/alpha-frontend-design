# P1 Security Closure — truth status, 2026-09-27

## Enforced pre-merge gates

Frontend ruleset `protect-main` (23705450) is active on the default branch, strict/up-to-date, no bypass actors, squash-only, and requires:
- `build`
- `deploy-test`

Backend ruleset `Protect Main` (23936816) is active on the default branch, strict/up-to-date, no bypass actors, and requires:
- `verify`

These rulesets were read back after the human-approved configuration change. A rules file is not treated as enforcement evidence.

## Proven post-merge frontend truth

Frontend main SHA `84fec1982784532c203268c2ac702075e27c78f8` was verified by automatic `push` runs:
- CI/build run 36282142088: PASS
- Cloudflare Deploy Test/deploy-test run 36282142104: PASS
- Real E2E/real-e2e run 36282142075: PASS

The main-push build used `VITE_FACTORY_MODE=http` and `VITE_FACTORY_API_BASE_URL=https://n8n-workflow-factory.onrender.com`.
Cloudflare used `versions upload`; production deployment was skipped.
The browser E2E established an OWNER session, sent the secure session cookie with the Factory GET, received HTTP 200, and rendered job status `completed`.

## Backend truth

Backend main SHA at this audit point is `63898e42fd331c0a17f540538f5ba47e0ae3f84f`.
Backend automatic main-push `verify` run 36281649693 passed.
Render service `srv-daqk0sp7lnhs73d9nr7g` was independently read back as LIVE on that same commit.

The backend repair adds an OWNER-only, cache-disabled `GET /api/runtime-truth` contract that reads Render's runtime-provided repository, branch, commit SHA, and service ID and fails closed if they are missing or unexpected.

## Runtime-bound Real E2E

The frontend repair stores the expected backend release identity in `config/backend-runtime-truth.json`.
Before the existing application-driven Factory GET may count as PASS, the browser must read `/api/runtime-truth` with the authenticated cross-origin session and require an exact match for:
- repository
- branch
- commit SHA
- Render service ID

A mismatch, missing endpoint, 401/403, 503, CORS failure, malformed response, stale backend deployment, or wrong service prevents `REAL_E2E_PASS`.
The Factory read remains application-driven through the bundled `FactoryStore -> HttpFactoryService` recovery path. No POST, approval, job generation, n8n execution, paid call, or production traffic change is part of the smoke test.

## Promotion gate

`scripts/promotion-gate.mjs` accepts only the exact current frontend main SHA and the latest successful automatic `push` run/job for:
- `ci.yml / build`
- `cloudflare-deploy-test.yml / deploy-test`
- `real-e2e.yml / real-e2e`

Because `real-e2e` is runtime-bound, promotion cannot pass merely from frontend CI plus a responsive backend; the tested live Render deployment must match the versioned backend release identity.

## Current repair status

The runtime-truth endpoint and backend documentation changes are on branch `repair/p1-runtime-truth-20260927`.
The frontend backend-SHA binding and documentation changes are on branch `repair/p1-backend-sha-binding-20260927`.
Neither repair branch is authorized for merge by this document. No production deployment is authorized.

Required merge order for a later human gate:
1. backend repair -> required `verify` -> merge -> Render LIVE on resulting backend main SHA
2. update frontend backend pin to that resulting backend merge SHA if it differs from the currently pinned SHA
3. frontend repair -> required checks + real E2E -> merge
4. require all automatic post-merge frontend main runs to PASS on the exact resulting frontend main SHA

## Separate stale work

Backend PR #17 remains outside this P1 repair and must not be mixed into it. Its compatibility must be revalidated independently before any future merge.
