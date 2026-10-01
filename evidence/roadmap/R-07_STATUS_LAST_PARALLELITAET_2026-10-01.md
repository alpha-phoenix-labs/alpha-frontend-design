# Roadmap Punkt 7 – Härtungsphase Last und Parallelität: Abschlussstatus

Stand: 2026-10-01 · Quelle: CRAFTFLOW_POST_M1_ROADMAP (20 Punkte), Punkt 7
Kennzeichnung: BELEGT = geprüft · ANNAHME · NICHT GEPRÜFT
Status: **WARTET AUF ABNAHME DURCH DEN BOSS** (Definition of Done 11.1)

## Ziel und Abnahme laut Roadmap
Ziel: mehrere gleichzeitige Aufträge, Race Conditions, Idempotency, Duplicate Requests kontrolliert.
Abnahme: keine Doppelverarbeitung, keine Zustandsinkonsistenz, dokumentierte Grenzwerte. Evidence: Szenarioprotokolle, Metriken, Grenzwerttabelle.

## 7a – Baseline und Befund (BELEGT, Code BE `cecc5cb`)
| # | Thema | Befund | Ergebnis |
|---|---|---|---|
| B1 | Paralleler Lauf desselben Jobs | CAS-Claim `version` + `inFlightStep:null` (`lib/orchestrator/store.ts:14`) | ok |
| B2 | Duplikat mit gleicher `clientRequestId` | Unique + P2002 (`app/api/orchestrator/route.ts`) | ok |
| B3 | Duplikat ohne `clientRequestId` | Feld war optional → doppelte Jobs möglich | behoben (7c) |
| B4 | Doppel-Approval | CAS (`approve/route.ts`) | ok, Test ergänzt (7b) |
| B5 | Doppel-Archivierung | Claim `archiveStatus → IN_PROGRESS` (`drive-store.ts`) | ok, Test ergänzt (7b) |
| B6 | Archivierung vor COMPLETED | 500 statt 409 | behoben (7c) |
| B7 | Approve-Fehlertext roh, Konflikt 500 | ohne `publicErrorCode` | behoben (7c) |
| B8 | Rate-Limit nur im Prozessspeicher | korrekt nur bei 1 Render-Instanz | Grenzwert, siehe unten |
| B9 | Parallele n8n-Tests | Webhook-Pfad/Node-ID per HMAC je `jobId` | ok |
| B10 | Absturz während `inFlightStep` | manuelle Reconciliation nötig | Roadmap-Punkt 9 |

## 7b/7c – Tests und Fixes (BELEGT)
- BE#42 → main `5915a26` (merged 2026-10-01 04:23 UTC): `__tests__/concurrency.test.cjs` (12 Tests: 5 parallele Creates, 5 parallele Duplikate, parallele Approve/Approve und Approve/Reject, veraltete Version, parallele Archivierung Store/Route, idempotente Re-Archivierung, B3/B6/B7). Mutationsprüfung: ohne Approval-CAS bzw. Archive-Claim 4 Tests rot; B3/B6/B7-Tests rot auf altem Code. `npm test` 152/152.
- Render `dep-dauu0ttg1s2s73d2ack0` live 04:25:19Z. FE-Pin FE#43 → main `3db6e14`; Real E2E 36815216781 und Gate 36815349805 PASS, `CLEANUP_OK`.

## 7d – Live-Messung parallele Aufträge (BELEGT)
Werkzeug: FE#44 → main `b5d9db8` (merged 04:47 UTC), Workflow `R-07 Parallel Load E2E` (`.github/workflows/parallel-load-e2e.yml`), nur `workflow_dispatch`, keine Promotion. Merge-Kette: Real E2E 36816770250, Promotion 36816852354, Gate 36816896437 – alle success.
Je Lauf: N echte Business-E2E-Aufträge gleichzeitig über `control.vantarialabs.tech` → `api.vantarialabs.tech` (BE `5915a26`), Login → Runtime-Pin → Auftrag → n8n-Test → Approval → Drive COMPLETE → Readback → Cleanup.

| Lauf | Run | Start (UTC) | N | PASS | Fehlerquote | Dauer min / p50 / p95 / max | Startversatz | Doppelte jobIds | Verschiedene n8n-Executions | Pin-Match | Cleanup | Cloudflare vorher = nachher | Artifact |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 7d-1 | 36817186087 | 04:53:48 | 3 | 3/3 | 0 | 34,2 s / 34,8 s / 34,9 s / 34,9 s | 2 ms | 0 | ja | 3/3 | 3/3 `CLEANUP_OK` | ja (`e081d735-bbc1-41e6-a068-fd7c81f7be29`) | 11141896742 |
| 7d-2 | 36817639147 | 04:59:40 | 5 | 5/5 | 0 | 37,8 s / 40,0 s / 42,8 s / 42,8 s | 2 ms | 0 | ja | 5/5 | 5/5 `CLEANUP_OK` | ja (`e081d735-bbc1-41e6-a068-fd7c81f7be29`) | 11142271529 |

Quelle: `PARALLEL_LOAD_SUMMARY` im Job-Log 110224706860 bzw. 110226084991. Einzel-jobIds und correlationIds je Lauf liegen im Artifact (`summary.json`, `load-runs/run-<i>.log`); aus der Agent-Umgebung nicht abrufbar (Proxy blockiert den Artifact-Blob-Host), daher hier nicht einzeln aufgeführt. Format der correlationId: `craftflow-load-<runId>-<attempt>-n<N>-<i>`.

Beobachtung: Mittlere Auftragsdauer steigt von 34,8 s (N=3) auf 40,0 s (N=5), Maximum von 34,9 s auf 42,8 s (+23 %). Kein Fehler, keine Doppelverarbeitung, keine Reste.

## Grenzwerttabelle (Stand BE `5915a26`)
| Grenze | Wert | Beleg | Bewertung |
|---|---|---|---|
| Parallele Aufträge, gemessen | 5 gleichzeitig ohne Fehler | 7d-2 | BELEGT; höhere N nicht gemessen |
| Owner-Login | 8 / 5 min je E-Mail | BE `lib/auth.ts:13` | begrenzt Parallelität je Owner-Konto; 7d-2 nach ≥ 5 min Abstand gestartet |
| Auftragsmutationen | 30 / min je Owner | BE `app/api/orchestrator/route.ts:80` | nicht erreicht |
| Approvals / Archiv / Test-Mark | je 30 / min, Test-Cleanup 20 / min | BE Routen | nicht erreicht |
| Rate-Limit-Speicher | im Prozess | BE `lib/orchestrator/rate-limit.ts:14` | gilt nur bei 1 Instanz (Render 1 Instanz laut Dossier, nicht neu geprüft) |
| Idempotenz-Schlüssel | `clientRequestId` Pflicht | BE#42 | Duplikate → derselbe Job |
| Auftragsdauer bei N=5 | max 42,8 s | 7d-2 | Referenzwert für Punkt 11/18 |

## Kosten
10 echte Production-Aufträge in Punkt 7d (2 Merge-Kette FE#44, 3 + 5 Messung), zusätzlich 2 durch FE#43 (Re-Test 7c). Tatsächliche Modellkosten NICHT GEPRÜFT (OpenAI-Verbrauchsmessung vom BOSS zurückgestellt; Roadmap-Punkt 12).

## Rollback-Basis
FE `b5d9db8` / Cloudflare `e081d735-bbc1-41e6-a068-fd7c81f7be29` · BE `5915a26` / Render `dep-dauu0ttg1s2s73d2ack0`.
Vorheriger Stand: FE `3db6e14` / Cloudflare `8768b27d-b0ca-44eb-897f-720ccd5bc88c`.

## Offen / Restrisiken
- Parallelität > 5 und mehrere Owner-Konten nicht gemessen (Login-Limit je Konto).
- Ressourcen von Render (CPU/RAM) während der Läufe NICHT GEPRÜFT.
- B10 (Reconciliation nach Absturz) gehört zu Punkt 9.

## Abnahme
Abnahmekriterien (keine Doppelverarbeitung, keine Zustandsinkonsistenz, dokumentierte Grenzwerte) sind durch 7b (Race-Tests) und 7d (2 Live-Läufe, 8 Aufträge, 0 Fehler, 0 Duplikate, 0 Reste) belegt. Offen: Bestätigung durch den BOSS.
