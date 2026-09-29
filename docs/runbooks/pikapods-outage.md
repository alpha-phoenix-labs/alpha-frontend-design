# PikaPods / n8n outage runbook

## Decision rule

If Craftflow reports `EXTERNAL_HTTP_502:IMPORT` and the response is `content-type: text/html`, classify it first as `EXTERNAL_DEPENDENCY_PIKAPODS`.

Do not assign root cause to Craftflow code until the n8n host is reachable again.

## Preflight

- `/healthz` should return HTTP 200.
- `/api/v1/workflows` without credentials should normally return 401/403, or 200 in an explicitly public test setup.
- HTTP 502 + HTML from the host means the upstream PikaPods/n8n service is unavailable.

The automated preflight retries with bounded backoff. Persistent failure produces `BLOCKED_EXTERNAL`, not a Craftflow code failure.
