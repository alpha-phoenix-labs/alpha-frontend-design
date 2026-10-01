# Roadmap Punkt 6 – Härtungsphase Fehlerfälle: Abschlussstatus

Stand: 2026-10-01 · Quelle: CRAFTFLOW_POST_M1_ROADMAP (20 Punkte), Punkt 6
Kennzeichnung: BELEGT = geprüft · ANNAHME · NICHT GEPRÜFT
Status: **WARTET AUF ABNAHME DURCH DEN BOSS** (Definition of Done 11.1)

## Ziel laut Roadmap
Verhalten bei 401 / 403 / 404 / 429 / 5xx / Timeout / Provider-Ausfall / n8n-Ausfall nachweisbar korrekt.

## PRs (alle gemergt, BELEGT über GitHub `merged_at`)
| PR | Inhalt | Merge-SHA main | merged_at (UTC) |
|---|---|---|---|
| BE#40 | Timeout/Netzwerk je Stufe klassifiziert, OpenAI-Retry einmal bei 429/503, POST-500 ohne Freitext | `6835adb` | 2026-09-30 19:29:42 |
| FE#39 | 403 → FORBIDDEN, 429 → RATE_LIMITED mit Retry-After, keine rohen HTML-Fehlerseiten; Pin `6835adb` | `2a6760d` | 2026-09-30 19:36:28 |
| FE#40 | Business-E2E prüft Backend-Runtime-Pin vor Job-Erstellung; JSON-Fehlertext gekürzt; Löschprotokoll Abschnitt C | `771755d` | 2026-09-30 19:53:16 |
| BE#41 | Drive-Trash nach verlorener Antwort per Readback bestätigt, Drive-Timeouts klassifiziert, `publicErrorCode` nur Code + key=value | `cecc5cb` | 2026-09-30 19:59:55 |
| FE#41 | Pin `cecc5cb` | `1fb1c5c` | 2026-09-30 20:04:23 |

## Fehlerkatalog (Fall × Erwartung × Nachweis)
| Fall | Erwartetes Verhalten | Nachweis | Status |
|---|---|---|---|
| 401 | FE: `UNAUTHORIZED`; BE: Routen lehnen ohne OWNER-Session vor jedem Datenzugriff ab | FE `HttpFactoryService.test.ts:356`; BE `control.test.cjs:210` | BELEGT (Unit) |
| 403 | FE: `FORBIDDEN` (FE#39); BE: Mutation von fremdem Origin → 403 | FE `HttpFactoryService.test.ts:357`; BE `cors.test.cjs` | BELEGT (Unit) |
| 404 | FE: `NOT_FOUND`, Recovery-GET 404 → null; n8n: `EXTERNAL_HTTP_404:<Stufe>`, Retry nur bei Webhook „not registered“ | FE `HttpFactoryService.test.ts:106,358`; BE `n8n-http-stage.test.cjs:11-60` | BELEGT (Unit) |
| 429 | FE: `RATE_LIMITED` + Wartezeit aus Retry-After; BE: OpenAI genau ein Retry, Wartezeit ≤ 5 s | FE `HttpFactoryService.test.ts:370`; BE `error-classification.test.cjs:86,95,109` | BELEGT (Unit) |
| 5xx | FE: HTML-Body → „HTTP 5xx: Dienst vorübergehend nicht erreichbar.“, JSON-Fehler gekürzt; BE: Freitext → `INTERNAL_ERROR`, OpenAI-Retry nur bei 503 | FE `HttpFactoryService.test.ts:386,415`; BE `error-classification.test.cjs:32,86` | BELEGT (Unit) |
| Timeout | FE: Timeout-Mapping, POST-Timeout → `MUTATION_UNCONFIRMED`; BE: `EXTERNAL_TIMEOUT:<Stufe>`, `LLM_TIMEOUT`, `DRIVE_*_TIMEOUT`, kein Retry | FE `HttpFactoryService.test.ts:281,428`; BE `error-classification.test.cjs:22`, `drive.test.cjs` | BELEGT (Unit) |
| Provider-Ausfall (OpenAI/Gemini/Drive) | Job `BLOCKED`, `costUnknown=true` bei unklarer Abrechnung, kein stiller Retry; Drive-Cleanup ohne zweiten PATCH | BE `error-classification.test.cjs`, `control.test.cjs` („unverifiable provider response…“), `drive.test.cjs` | BELEGT (Unit) |
| n8n-Ausfall (PikaPods) | `BLOCKED_EXTERNAL`, nie PASS; Gate Exit 2 | FE `scripts/n8n-preflight.mjs:18`, `post-deploy-production-gate.yml` (Enforce-Schritt) | BELEGT (Code); kein Live-Ausfall im Zeitraum beobachtet |

Testzählung nach Abschluss (BELEGT, PR-Texte und lokaler Lauf 2026-10-01 auf `cecc5cb`): BE `npm test` 140/140; FE laut FE#40 `vitest` 131/131, `node --test scripts/*.test.mjs` 48/48.

## Live-Nachweis nach Merge (BELEGT, Logs geprüft 2026-10-01)
| Lauf | SHA | Ergebnis |
|---|---|---|
| Real E2E 36768782128 | FE `771755d` | success; `runtimeTruth.matches=true` gegen BE `6835adb`; `CLEANUP_OK` (n8n DELETED, 5/5 Drive TRASHED) |
| Promotion 36768927880 / Gate 36769011746 | FE `771755d` | success (Gate-Log nicht im Detail geprüft) |
| Real E2E 36770062757 | FE `1fb1c5c` | success; `matches=true` gegen BE `cecc5cb`; `CLEANUP_OK` |
| Promotion 36770233975 | FE `1fb1c5c` | success |
| Gate 36770326745 | FE `1fb1c5c` | `POST_DEPLOY_PRODUCTION_E2E=PASS`; `matches=true`; `CLEANUP_OK`; Cloudflare promoted = before = after = `db0c4bde-2af6-488e-b7b6-62a19cf69881` |
| Render | BE `cecc5cb` | `dep-dauml09srm7s73b4k69g` live seit 2026-09-30 20:02:36Z; Vorgänger `dep-daum6su417fc73fe5b2g` (`6835adb`) deactivated |

Abweichung im Zeitraum: Real E2E 36766853195 (FE `2a6760d`) meldete `CLEANUP_INCOMPLETE` (2 Drive-Dateien mit `DRIVE_REQUEST_FAILED`), Ursache und Fix siehe BE#41 und `LOESCHPROTOKOLL.md` Abschnitt C.

## Nachtrag 2026-10-01: B6/B7 geschlossen, Re-Test (BELEGT)
| Schritt | Beleg |
|---|---|
| BE#42 → main `5915a26` (7b Race-Tests + 7c Fixes B3/B6/B7) | merged 2026-10-01 04:23 UTC; CI `verify` success; lokal `npm test` 152/152; 4 neue Tests rot auf altem Code |
| Render | `dep-dauu0ttg1s2s73d2ack0` live 04:25:19Z, Commit `5915a26` |
| FE#43 (Pin) → main `3db6e14` | merged 04:27 UTC |
| Real E2E 36815216781 | success; jobId `cmup1ajmm00003q68croxy1b3`; `matches=true` gegen `5915a26`; `CLEANUP_OK` (n8n DELETED, 5/5 Drive TRASHED) |
| Promotion 36815309745 | success |
| Gate 36815349805 | `POST_DEPLOY_PRODUCTION_E2E=PASS`; jobId `cmup1cmnw00013q686wqcsut3`; `matches=true`; `CLEANUP_OK`; Cloudflare promoted = before = after = `8768b27d-b0ca-44eb-897f-720ccd5bc88c`; Artifact 11140494202 |

Aktuelle Rollback-Basis: FE `3db6e14` / Cloudflare `8768b27d-b0ca-44eb-897f-720ccd5bc88c` · BE `5915a26` / Render `dep-dauu0ttg1s2s73d2ack0`.

## Rollback-Basis (Stand nach Punkt 6, vor 7c)
FE `1fb1c5c` / Cloudflare `db0c4bde-2af6-488e-b7b6-62a19cf69881` · BE `cecc5cb` / Render `dep-dauml09srm7s73b4k69g`.

## Lücken / offen
- Fault-Injection gegen Production wurde nicht durchgeführt (Gate der Roadmap: nur nach GO). Alle Fälle außer dem Pin-Abgleich sind nur über Unit-/Contract-Tests belegt.
- ~~B7: Approve-Route gab `error.message` ungefiltert zurück, Runner-Konflikte als 500.~~ **Geschlossen** mit BE#42 (Punkt 7c): `publicErrorCode`, Konflikte → 409.
- ~~B6: Archive-Route meldete Archivierung vor COMPLETED als 500.~~ **Geschlossen** mit BE#42 (Punkt 7c): → 409.
- Das QA-Audit `2026-09-30-audit-07-r06-post-merge-truth` liegt nicht im FE-Repo (NICHT GEPRÜFT, nur in FE#40/BE#41 zitiert).
- Offene Entscheidungen des BOSS aus dem QA-Audit: Ausnahme für `evidence`/`release`-Commits in CF-PM-001, QA-Lesezugriff BE-Repo, Ablageort QA-Berichte, `CLEANUP_INCOMPLETE` als Gate-Fehler.
- Neue Pflicht seit FE#40: Nach jedem BE-Deploy muss `config/backend-runtime-truth.json` nachgezogen werden, sonst blockiert Real E2E jeden FE-Deploy.

## Abnahme
Abnahmekriterium laut Roadmap: „Fehlerkatalog vollständig, jeder Fall hat Test und Evidence; Abweichungen behoben oder ausdrücklich als Backlog freigegeben.“
B6/B7 sind behoben und live nachgetestet (siehe Nachtrag). Offen: Bestätigung durch den BOSS.
