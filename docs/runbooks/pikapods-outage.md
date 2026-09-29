# PikaPods / n8n outage runbook

## Scope

This runbook applies to Craftflow M1 production-E2E preflight and n8n integration failures involving the configured PikaPods-hosted n8n test instance.

It does not classify unrelated Craftflow application errors.

## Decision rule

If a Craftflow n8n request fails with:

- HTTP `502`, and
- response `content-type` contains `text/html`

classify the incident as:

`BLOCKED_EXTERNAL / EXTERNAL_DEPENDENCY_PIKAPODS`

until the n8n host is reachable again.

Do not attribute this condition to Craftflow code solely from the 502 response.

## Required checks

Check the configured n8n host in this order:

1. `GET /healthz`
   - expected healthy result: HTTP 200
2. `GET /api/v1/workflows` without credentials
   - expected reachability result: HTTP 401 or 403
   - HTTP 200 is acceptable only if the endpoint is intentionally public in the test environment
3. Inspect `content-type`
   - `502 + text/html` is treated as upstream PikaPods/n8n unavailability

A successful health response alone does not prove the full Craftflow E2E. It only clears the external-dependency preflight.

## Retry and time budget

The automated preflight uses bounded retries only.

Current policy:

- maximum attempts: 3
- retry delays: 0s, 2s, 5s
- no unbounded retry loop
- after the final failed attempt, terminate the preflight with non-zero exit status

If the upstream remains unavailable after the retry budget, the E2E must stop as `BLOCKED_EXTERNAL`.

It must not be converted to PASS and must not allow release/tag gates to pass.

## Status semantics

### PASS

Use only when the n8n preflight confirms host reachability and the downstream E2E later satisfies its own required checks.

### BLOCKED_EXTERNAL

Use when the external n8n/PikaPods dependency is unavailable or unreachable after the bounded retry budget.

This is a failed release gate for the current run. It is not a Craftflow code PASS and is not evidence of a Craftflow runtime defect by itself.

### FAIL

Use when the dependency is reachable but the tested Craftflow/n8n behavior fails for a reason attributable to the tested path rather than upstream host availability.

## Release behavior

When status is `BLOCKED_EXTERNAL`:

- stop the production-E2E run;
- do not mark the production-E2E gate PASS;
- do not mark M1 Production Freeze PASS;
- do not create or verify release tags;
- preserve the observed HTTP status and content-type in sanitized evidence;
- retry later only after the dependency becomes reachable.

## Operator message

The workflow warning/error should point to this file:

`docs/runbooks/pikapods-outage.md`

Expected classification message:

`EXTERNAL_DEPENDENCY_PIKAPODS: received HTTP 502 with text/html from n8n host; see docs/runbooks/pikapods-outage.md`

## Evidence boundary

A PikaPods outage explains the external dependency failure for the affected run only.

After recovery, the exact release must still complete the required Production-domain E2E and all remaining release gates. Previous PASS evidence must not be silently reused for a different release SHA or deployment identity.
