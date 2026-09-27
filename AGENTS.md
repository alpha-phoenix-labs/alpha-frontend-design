# AGENTS.md — CRAFTFLOW Frontend Bot Workspace

## Scope
Dieses Repository ist der einzige freigegebene Arbeitsbereich für das 6-Bot-UI-Team.
Kein Agent darf auf andere CRAFTFLOW-/ALPHA-Repositories zugreifen, deren Inhalte anfordern, kopieren, spiegeln oder verändern.

## Human Gate
Ohne ausdrückliche menschliche Freigabe sind verboten:
- produktive Deployments
- destruktive Änderungen
- kostenpflichtige Aktionen
- Zugriff auf neue Repositories oder externe Systeme
- Einbringen von Secrets, Tokens, Zugangsdaten oder produktiven Kundendaten

## Rollen und Schreibbereiche

### Chef
Aufgabe: Orchestrierung, Integration, Review und Delegation.
Schreibbereich:
- src/App.tsx
- src/main.tsx
- docs/
Chef koordiniert Änderungen außerhalb dieser Pfade vorab.

### Alpha-Spatial
Schreibbereich:
- src/components/canvas/
- src/scenes/

### Alpha-Surface
Schreibbereich:
- src/components/ui/
- src/styles/

### Alpha-Core
Schreibbereich:
- src/store/
- src/types/
- src/hooks/

### Alpha-QA
Lesezugriff auf das gesamte Repository.
Schreibbereich ausschließlich:
- audit/
Alpha-QA verändert keinen Produktivcode.

### Alpha-Deploy
Schreibbereich:
- package.json
- vite.config.ts
- tsconfig.json
- wrangler.toml
- dist/
- .github/workflows/ nur nach Freigabe durch Chef

## Prozess
1. Mensch kommuniziert ausschließlich mit Chef.
2. Chef zerlegt und delegiert.
3. Spezialisten ändern ausschließlich ihre freigegebenen Bereiche.
4. Chef integriert.
5. Alpha-QA prüft den integrierten Stand.
6. Bei STATUS: BLOCKIERT geht der Fehler an den zuständigen Agenten zurück.
7. Schleife bis STATUS: FREIGEGEBEN oder Human Gate.
8. Produktiv-Deployment nur nach ausdrücklicher menschlicher Freigabe.

## Sicherheitsregeln
- Keine .env-Dateien committen.
- Keine API-Keys, Tokens, Passwörter oder privaten Schlüssel committen.
- Keine produktiven Kundendaten.
- Keine Inhalte aus nicht freigegebenen Repositories übernehmen.
- Keine Umgehung von Branch-, Review- oder Human-Gate-Regeln.
- Keine Platzhalter als abgeschlossen melden.

## POST-MERGE TRUTH RULE — CF-PM-001 (binding)

Applies to every ASTRA, Builder and agent change in the active Craftflow delivery path.
PR checks, CI, a build or a successful merge alone MUST NOT be reported as technical completion.

1. Before changing a workflow record TRIGGER -> EXECUTION -> RESULT -> ENFORCEMENT, for the exact repository, branch and commit SHA.
2. Every mandatory main post-merge process MUST run automatically for every main update, produce a machine-verifiable visible result, and fail closed. A workflow_dispatch-only mandatory process is FAIL — MANUAL DEPENDENCY.
3. Required steps missing, skipped, cancelled, timed out, pending, stale or associated with another SHA MUST NOT count as success. Failure of a dependency MUST propagate through an always-running final gate; continue-on-error or silent fallback MUST NOT hide failures.
4. The mandatory process inventory MUST cover build, real-mode preview upload, real browser -> frontend -> HTTP -> Factory proof, backend deployment SHA and runtime verification. Publish repository SHAs, run URLs, preview version and actual outcomes. A preview upload or health-only response is NOT E2E.
5. Frontend main pushes MUST use VITE_FACTORY_MODE=http and VITE_FACTORY_API_BASE_URL=https://n8n-workflow-factory.onrender.com and MUST NOT route production traffic. Production remains a separate explicit human-authorized action.
6. Promotion/release MUST be technically blocked unless every required post-merge result for that exact SHA succeeds. Required PR checks MUST enforce trigger/configuration regression tests. Ruleset enforcement MUST be read back; documentation is not enforcement.
7. Before approving a mechanism, test removal of a main trigger, a skipped/failed prerequisite, unavailable runtime, missing/stale evidence and absent credentials. Each MUST produce a visible failure and prevent technical completion/promotion.
8. Every audit MUST separately report PASS, FAIL, UNKNOWN / INSUFFICIENT EVIDENCE, NOT PROVEN and NOT AUDITED — TIME LIMIT. Never upgrade incomplete evidence to PASS.
9. No merge, production deploy, secret rotation, paid resource or contract change is authorized by this rule.
10. META-AUDIT: ask whether the same omitted automatic post-merge step can still pass. If yes, enforcement is INCOMPLETE and approval remains blocked. A rule file alone never satisfies this requirement.

Enforcement status at 2026-09-27 audit: INCOMPLETE. Frontend build/preview triggers have regression coverage in the proposed branch; automatic authenticated browser evidence and promotion enforcement still require implementation and verification. Backend required-check enforcement is absent in the observed ruleset. Do not report this rule as fully enforced or this audit as PASS.

### Three distinct enforcement layers (P1 closure)
- PRE-MERGE GATE: required PR contexts validate code and delivery configuration. Proposed contexts: frontend `build` + `deploy-test`; backend `verify`. Ruleset mutation requires a separate HUMAN GATE.
- POST-MERGE TRUTH: automatic push-to-main runs validate the actual merged SHA, including real browser transport. PR runs and workflow_dispatch runs are not substitutes.
- PROMOTION GATE: the frontend production step must first run `scripts/promotion-gate.mjs`. It requires the current main SHA, successful latest automatic runs and non-skipped jobs for `ci.yml/build`, `cloudflare-deploy-test.yml/deploy-test`, and `real-e2e.yml/real-e2e`. A final main-SHA recheck rejects main advancing during verification.
- The real E2E workflow/credential mechanism does not exist yet. Its reserved workflow/job names above are requirements, NOT claims of implemented E2E. Until implemented and evidenced, promotion fails closed with `FAIL — POST-MERGE TRUTH MISSING`.
- Tests of the promotion verifier prove rejection logic only; they do not prove a live browser, Factory connection, deployment or ruleset enforcement. Current main has not incorporated this review branch.
