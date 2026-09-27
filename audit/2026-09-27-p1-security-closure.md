# P1 Security Closure — truth status, 2026-09-27

## Enforced pre-merge gates

Frontend ruleset `protect-main` (23705450) is active on the default branch, strict/up-to-date, no bypass actors, squash-only, and requires:
- `build`
- `deploy-test`

Backend ruleset `Protect Main` (23936816) is active on the default branch, strict/up-to-date, no bypass actors, and requires:
- `verify`

These rulesets were read back after the human-approved configuration change. A rules file is not treated as enforcement evidence.

## Proven post-merge frontend truth

P1 implementation merge SHA `07e76c48bb7ebd04a708c123d69d9f6cdf3c1b4c` was verified by automatic `push` runs:
- CI/build run 36314457748: PASS
- Cloudflare Deploy Test/deploy-test run 36314457552: PASS
- Real E2E/real-e2e run 36314457569: PASS

The main-push build used `VITE_FACTORY_MODE=http` and `VITE_FACTORY_API_BASE_URL=https://n8n-workflow-factory.onrender.com`.
Cloudflare used `versions upload`; the production deployment step was skipped.
The browser E2E checked out the exact implementation SHA, established an OWNER session, sent a secure `SameSite=None` session cookie with the Factory GET, received HTTP 200, matched UI status `completed`, proved the unavailable-backend and wrong-expected-status negative paths fail closed, and emitted `REAL_E2E_PASS`.

This SHA is the evidenced P1 implementation baseline, not a permanent claim about the repository's future `main` head. Any later documentation-only merge can advance `main`; current repository truth must always be read live rather than inferred from this historical audit record.

## Backend truth

Backend main SHA at this audit point is `43ef17acf0cd60aa8cd894139cae6489cf7f32bd`.
Backend automatic main-push `verify` run 36283072671 passed.
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

## P1 closure status

Backend PR #23 is MERGED. Backend `main` and Render LIVE are both `43ef17acf0cd60aa8cd894139cae6489cf7f32bd`, and backend `verify` passed.

Frontend PR #13 is MERGED by squash as `07e76c48bb7ebd04a708c123d69d9f6cdf3c1b4c`. The versioned backend runtime pin is `43ef17acf0cd60aa8cd894139cae6489cf7f32bd`, exactly matching backend `main` and Render LIVE.

All mandatory automatic post-merge frontend checks passed on the exact P1 implementation merge SHA:
- `build`: PASS
- `deploy-test`: PASS
- `real-e2e`: PASS

No production Cloudflare deployment was authorized or executed by this P1 closure. P1 final hardening is technically complete at the evidenced implementation baseline above. Any later production promotion remains a separate HUMAN GATE and must independently satisfy the promotion gate against the then-current exact `main` SHA.

## Separate stale work

Backend PR #17 remains outside this P1 repair and must not be mixed into it. Its compatibility must be revalidated independently before any future merge.
