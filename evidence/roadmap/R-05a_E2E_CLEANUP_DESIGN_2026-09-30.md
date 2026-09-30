# R-05a – Automatisches E2E-Cleanup: Design (ENTWURF zur BOSS-Freigabe, kein Code)

Stand: 2026-09-30 · Roadmap Punkt 5/20 · Grundlage: R-02d (n8n), R-03c (Drive-Regel, Freigabe offen), R-04a (DB)
Human Gate: nur Dokument. Jede Umsetzung ist Code auf `main` = Deploy (BE → Render `n8n-workflow-factory` `srv-daqk0sp7lnhs73d9nr7g`; FE → Real E2E → Production Promotion) und wird vorher angesagt.

## 1. Ist-Zustand (belegt)
| System | Was ein E2E-Lauf hinterlässt | Beleg |
|---|---|---|
| n8n | 1 Workflow „HF TEST · … · jobId[:12]“ (nur deaktiviert) + 1 Execution | BE `lib/orchestrator/agents.ts:195`, `n8n-native.ts:90`; R-02d: 33 Workflows |
| Drive | 5 Dateien in den Produktiv-Ordnern 01–04 | BE `lib/integrations/drive-api.ts:110-132`; R-03a: 105 Dateien |
| DB | 1 `WorkflowJob`-Zeile, dauerhaft | kein Löschpfad im Code (R-04a) |
| Korrelation | correlationId nur in FE-Evidence und teils im Prompt; BE/Drive/n8n kennen sie nicht | FE `post-deploy-production-gate.yml:217-235`; Drive-Auftrag cmun7vi43 |

## 2. Zielbild
Am Ende jedes E2E-Laufs (Real E2E und Post-Deploy Gate) wird genau das entfernt, was dieser Lauf erzeugt hat – belegt über jobId **und** correlationId **und** Testmarker. Ergebnis wird als eigener Status in `result.json` geführt.

## 3. Bausteine (kleinste Schnitte)
**S1 – Testmarker in der DB (BE, Migration = Deploy)**
- `WorkflowJob`: `isTest Boolean @default(false)`, `correlationId String?` (+ Index).
- Setzen nur über einen neuen, OWNER-geschützten Aufruf `POST /api/orchestrator/test-mark {jobId, correlationId}`; erlaubt nur, wenn Job < 15 min alt und noch nicht markiert. Kein Setzen über die normale UI.

**S2 – Cleanup-Endpunkt (BE)**
- `POST /api/orchestrator/test-cleanup {jobId, correlationId}` (OWNER, CORS wie bestehende Mutationen, Rate-Limit).
- Guards (alle müssen passen, sonst `CLEANUP_SKIPPED_GUARD`): `isTest=true` · `correlationId` identisch · Status terminal (COMPLETED/FAILED/BLOCKED) · Job-Alter < 2 h.
- n8n: Workflow `testReport.importedId` per GET prüfen (Name beginnt `HF TEST · ` und endet `· jobId[:12]`, `active=false`) → DELETE; danach GET = 404. Execution-ID vorher im Ergebnis sichern.
- Drive (nach R-03c): nur Dateien mit `appProperties hfJobId=jobId, hfTest=true, hfCorrelationId=correlationId`, max. 5 → Papierkorb.
- DB: Zeile erst nach erfolgreichem n8n+Drive-Cleanup löschen (oder `archiveStatus='CLEANED'`, siehe Entscheidung E3).
- Idempotent: zweiter Aufruf liefert `CLEANUP_OK` mit „bereits entfernt“.
- Antwort: `{status: CLEANUP_OK|CLEANUP_INCOMPLETE|CLEANUP_SKIPPED_GUARD, n8n:{…}, drive:{…}, db:{…}}` ohne Secrets/Pfade.

**S3 – Drive-Testordner + Pflichtmetadaten (BE)** – Umsetzung von R-03c Regel 1–2 (eigene Folder-IDs im Testmodus, fail-closed).

**S4 – E2E-Skripte (FE)**
- `scripts/real-business-e2e.mjs`: nach Job-Erstellung `test-mark`, am Ende (auch bei Fehler, in `finally`) `test-cleanup`; Ergebnis in `evidence.cleanup`.
- `post-deploy-production-gate.yml`: `cleanup_status` in `result.json`; `CLEANUP_INCOMPLETE` macht den Gate-Lauf nicht PASS-neutral, sondern wird sichtbar gemeldet (Entscheidung E2).
- Evidence-Anker-Läufe (Release-definierend): Cleanup überspringen per Flag `E2E_KEEP_ARTIFACTS=true` → `CLEANUP_SKIPPED_EVIDENCE`.

## 4. Tests (Pflicht, vor jedem Merge)
- Positiv: vollständiger Lauf → n8n 404, 0 Drive-Treffer, DB-Zeile weg/markiert.
- Guards: falsche correlationId · fehlender Marker · Produktivjob (`isTest=false`) · Job zu alt · Workflow-Name passt nicht · mehr als 5 Drive-Treffer → jeweils `CLEANUP_SKIPPED_GUARD`, nichts gelöscht.
- Idempotenz: 2× aufrufen. Teilausfall: n8n 5xx / Drive-Fehler → `CLEANUP_INCOMPLETE`, DB-Zeile bleibt.
- Abnahme laut Roadmap: 2 aufeinanderfolgende Läufe hinterlassen 0 Reste (Nachinventar mit R-02d-Lesezugriff + Drive-Suche).

## 5. Reihenfolge / Deploy-Wirkung
1. S1+S2 (BE, eine PR, Migration) → Merge = Render-Deploy `srv-daqk0sp7lnhs73d9nr7g`
2. S3 (BE) → Render-Deploy
3. S4 (FE) → Merge = Real E2E → Production Promotion (Cloudflare)
Rollback-Basis heute: BE `60da25e` (dep-dau23arrjlhs73cc13k0), FE `8ca8c28` (Cloudflare 16bc24fd-d784-4292-9ced-8057901b5489).

## 6. Entscheidungen BOSS
- E1: Design S1–S4 freigeben? (Voraussetzung: R-03c-Regel freigeben)
- E2: Soll `CLEANUP_INCOMPLETE` den Post-Deploy-Gate-Lauf auf FAIL setzen (strenger) oder nur melden?
- E3: DB-Zeile löschen oder nur als `CLEANED` markieren (behält Kosten-/Laufzeitdaten für Punkt 11/12)? Empfehlung: markieren.
- E4: DB-Ablauf 25.10.2026 (R-04a) vor S1 klären – Migration auf eine ablaufende Free-DB ist nicht sinnvoll.
