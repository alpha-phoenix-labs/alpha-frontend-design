# P1 Security Closure — review only, 2026-09-27

## Human gate: required checks
Do not apply ruleset mutations automatically. Preserve all other rules, bypass restrictions and existing checks.
Frontend protect-main (23705450): ADD REQUIRED STATUS CHECK: deploy-test, integration_id 15368 (GitHub Actions); retain build and strict policy.
Backend Protect Main (23936816): ADD REQUIRED STATUS CHECK: verify, integration_id 15368; propose strict_required_status_checks_policy=true.
After human approval, read rules back and demonstrate a failed required check blocks merge. This has NOT been performed.

Evidence:
- Frontend PR push run 36279147017: job deploy-test, success.
- Frontend PR run 36276948270: job deploy-test, failure at Typecheck.
- Backend PR run 36272449034: job verify, success.
- Backend PR run 36272390714: job verify, failure at full Next.js TypeScript check.
- verify covers npm ci, Prisma generation, full typecheck, controlled/mock tests, Next.js build and high-severity production dependency audit.
- All these jobs are unconditional; no continue-on-error masks the required steps. They prove their checks, not E2E.

## Promotion implementation and limit
scripts/promotion-gate.mjs queries GitHub using the workflow GITHUB_TOKEN (contents:read, actions:read).
It accepts only the current main SHA and the latest successful PUSH runs of every mandatory workflow; verifies source repository, workflow identity, main branch, SHA, job status and conclusion; rechecks main before returning.
No manual success flag, PR event, workflow_dispatch event, older successful run or skipped job qualifies.
Missing real-e2e.yml, missing token, API failure or pending/failed evidence blocks production.
The guard is immediately before the production step. It does not dispatch workflows or deploy.
This remains a branch implementation; running it on production was prohibited.

## Smallest real E2E design — BLOCKED
Required future workflow: .github/workflows/real-e2e.yml, unconditional job context real-e2e on push to main.
1. Resolve preview URL and Cloudflare version from the successful automatic delivery run for this exact frontend SHA. Record both; never use an arbitrary/latest production URL.
2. Open that real preview in a clean real browser with an approved read-only test-owner session and an existing synthetic job ID.
3. Trigger the application's existing FactoryService.getJobStatus(jobId) through an approved UI/test mechanism using the SAME bundled singleton and HttpFactoryService. Do not bypass the adapter with page fetch, Playwright request, route.fulfill, mocked responses or direct API-only tests.
4. Assert actual HTTP mode and expected Factory origin; capture the browser GET /api/orchestrator?jobId=...; require genuine HTTP 200, JSON DTO with matching jobId, integer version, allowed status and valid nullable fields; assert the application consumes that response.
5. Record exact frontend SHA, preview version, backend deployment SHA and redacted network evidence. No POST, approval, job generation, n8n execution or external paid call.
6. Missing credentials, unavailable preview/backend, 401/403, CORS, timeout, invalid DTO or failed assertion must fail the job visibly; no skipped-success branch.
7. Test runner never uploads session storage, cookies or tokens as artifacts.

BLOCKED — REQUIRED TEST CREDENTIAL/E2E MECHANISM MISSING.
No approved browser session provisioning / known synthetic job / application read-only trigger is established.
Current HttpFactoryService defaults to same-origin credentials while the preview and Render are different origins. Do not improvise credentials:include, CORS or auth changes. Prove the approved transport/auth mechanism separately before implementing this smoke.
A health response alone is never E2E. The reserved real-e2e job is not yet implemented.

## PR 17 isolation
Open, head 11d8459249f1e40513f000d36d1d5462c2a09618.
Against main 85ce155202f977a68e087ccd76017fb8853650f5: diverged, 13 ahead, 3 behind; merge base 65fc1c807b583fd66091b3ce1810f1859cb2f9ab.
GitHub reports mergeable=true, mergeable_state=unstable. No reported textual merge conflict, but semantic compatibility unproven.
Head CI run 36141817962: failure.
Classification: STALE — REBASE/REVALIDATION REQUIRED. Do not mix into this repair or merge it.
