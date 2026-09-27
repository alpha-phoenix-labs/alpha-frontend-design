# AGENTS.md — CRAFTFLOW Frontend Bot Workspace

## Scope
Dieses Repository ist der einzige freigegebene Arbeitsbereich für das 6-Bot-UI-Team.
Kein Agent darf auf andere CRAFTFLOW-/ALPHA-Repositories zugreifen, deren Inhalte anfordern, kopieren, spiegeln oder verändern.

## Human Gate
Ohne ausdrückliche menschliche Freigabe sind verboten:
- direkte oder manuelle produktive Deployments außerhalb des freigegebenen automatischen Promotion-Pfads
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
8. Produktiv-Deployment erfolgt ausschließlich automatisch über `.github/workflows/production-promotion.yml`, nachdem alle exakten Post-Merge-Pflichtchecks für denselben `main`-SHA erfolgreich sind. Direkte/manuelle Produktiv-Deployments bleiben verboten.

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
5. Frontend main pushes MUST use VITE_FACTORY_MODE=http and VITE_FACTORY_API_BASE_URL=https://n8n-workflow-factory.onrender.com. The deploy-test workflow MUST NOT route production traffic. Production promotion MUST occur automatically only after the exact current main SHA has successful mandatory post-merge truth for build, deploy-test and real-e2e.
6. Promotion/release MUST be technically blocked unless every required post-merge result for that exact SHA succeeds. Required PR checks MUST enforce trigger/configuration regression tests. Ruleset enforcement MUST be read back; documentation is not enforcement.
7. Before approving a mechanism, test removal of a main trigger, a skipped/failed prerequisite, unavailable runtime, missing/stale evidence and absent credentials. Each MUST produce a visible failure and prevent technical completion/promotion.
8. Every audit MUST separately report PASS, FAIL, UNKNOWN / INSUFFICIENT EVIDENCE, NOT PROVEN and NOT AUDITED — TIME LIMIT. Never upgrade incomplete evidence to PASS.
9. No merge, secret rotation, paid resource or contract change is authorized by this rule. Production deploy is authorized only through the automatic exact-SHA promotion workflow after all mandatory post-merge checks pass; all other production deploy paths remain unauthorized.
10. META-AUDIT: ask whether the same omitted automatic post-merge step can still pass. If yes, enforcement is INCOMPLETE and approval remains blocked. A rule file alone never satisfies this requirement.

Enforcement status is evidence-driven, not a static release claim. The active frontend ruleset requires `build` and `deploy-test` with strict/up-to-date enforcement and no bypass actors; the backend ruleset requires `verify`. Automatic main-push CI, no-traffic HTTP-mode preview, authenticated real-browser Factory E2E, and the exact-SHA promotion gate are implemented. Real E2E additionally MUST prove the live Render backend identity against `config/backend-runtime-truth.json`; a health check, successful login, or Factory HTTP 200 without matching backend runtime SHA is insufficient. Completion must always be re-established from exact current run/deploy evidence.

### Three distinct enforcement layers (P1 closure)
- PRE-MERGE GATE: active required PR contexts are frontend `build` + `deploy-test` and backend `verify`, with strict/up-to-date enforcement. Ruleset mutation still requires a separate HUMAN GATE.
- POST-MERGE TRUTH: automatic push-to-main runs validate the actual merged SHA, including real browser transport. PR runs and workflow_dispatch runs are not substitutes.
- PROMOTION GATE: `.github/workflows/production-promotion.yml` is triggered automatically by successful Real E2E completion for a push to `main`. It checks out the triggering SHA, builds in HTTP production mode, waits for `scripts/promotion-gate.mjs` to prove successful latest automatic runs and non-skipped jobs for `ci.yml/build`, `cloudflare-deploy-test.yml/deploy-test`, and `real-e2e.yml/real-e2e`, and only then runs the Cloudflare production deploy. A final main-SHA recheck rejects main advancing during verification.
- The real E2E workflow is implemented and credentialed. It uses a real browser, the bundled Factory path for the job read, and a separate read-only runtime-truth request. It must fail if the live Render repository, branch, commit SHA, or service ID differs from the versioned backend pin.
- Tests of the promotion verifier prove rejection logic only. Full PASS additionally requires exact current main-push runs, the live browser evidence, and matching Render runtime identity.
