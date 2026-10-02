# Roadmap Punkte 1–5 – Abschlussstatus

Stand: 2026-09-30 · Quelle: CRAFTFLOW_POST_M1_ROADMAP (20 Punkte)
Diese Datei ist maßgeblich. Die Einzelberichte R-02a … R-05a waren Arbeitsstände (Kennzeichnung „ENTWURF“) und bleiben unverändert als Verlauf erhalten.
Kennzeichnung: BELEGT = geprüft · ANNAHME · NICHT GEPRÜFT

## Punkt 1 – Diagnose-PRs archivieren: ERLEDIGT
- FE#28, BE#35, BE#37 geschlossen mit Archivkommentar; Evidence gemergt mit FE#36 (`R-01_DIAGNOSE_PRS_ARCHIV_2026-09-30.md`). BELEGT.

## Punkt 2 – n8n-Testinstanz bereinigen: TEILWEISE
- Executions: 0 (Run 36752507546, Versuch 4, 18:48 UTC). BELEGT. Die Evidence-Anker-Executions 21, 22, 23, 24, 29 sind verloren; Ursache NICHT BELEGT (ANNAHME: manuelle Löschung).
- Workflows: 33, davon 16 (Kat. A) + 2 (Kat. D, TEMP PR36) zum Löschen freigegeben. Die Löschung erfolgt durch den BOSS in der n8n-UI; offen.
- Die 5 Anker-Workflows sind vorhanden (HTTP 200). BELEGT.
- Governance-Widerspruch: „VantomLabs SHK Kundenanfrage-Assistent v1.1“ (2HRwNqSmBfuRMBwc) und „Agent Swarm“ (u1BHUlVbltZXEwq0) liegen auf der Testinstanz, was BE README.md:59-60 widerspricht. BOSS-Entscheidung 2026-09-30: löschen. Offen, wird durch den BOSS ausgeführt.

## Punkt 3 – Drive bereinigen: ERLEDIGT (bis auf Anker)
- Batch 1: 42 Dateien in den Papierkorb, Protokoll in R-03b. BELEGT.
- 04-FERTIG: vom BOSS manuell geleert. Damit fehlen die 10 Evidence-Anker (FINAL_workflow/documentation der 5 Anker-Jobs). Abweichung dokumentiert in R-03b.
- Batch 2 (BOSS-GO 2026-09-30): 6 Dateien der UNKLAR-Jobs cmukb7kma000012x8gwq7jdq1 und cmukh5ylt0002grpz9phsemg3 in den Papierkorb. BELEGT.
  | Datei-ID | Job | Art | Ergebnis |
  |---|---|---|---|
  | 1pZ8L6Ge2u1F0GWPpwKa2KhHQwCS2mwdY | cmukb7kma | auftrag | trashed (`{}`) |
  | 1Qek1vumCtge8Yp7YgH4iUqFQZOuQzZl8 | cmukb7kma | workflow | trashed (`{}`) |
  | 1a0OnNnuU4BW-BYYR5qqdrV8JeC8HhVQE | cmukb7kma | testreport | trashed (`{}`) |
  | 1NJVeg4riX4w_pV4lZHCtSJ7PnnwQp7zV | cmukh5ylt | auftrag | trashed (`{}`) |
  | 1xuqHp6-h-swwkat3A6RuZwTQs0WlxhOS | cmukh5ylt | workflow | trashed (`{}`) |
  | 1wlavHb0ehLbVUPR7DEJ6zRv3kWn0dhl3 | cmukh5ylt | testreport | trashed (`{}`) |
- Nachinventar 01–04: 15 Dateien = 5 Anker-Jobs × 3 (auftrag/workflow/testreport), 04-FERTIG leer. BELEGT.

## Punkt 4 – Backend-DB: PFAD DEFINIERT (Option B)
- Baseline in R-04a. Zählungen NICHT MÖGLICH (leere IP-Allowlist).
- Cleanup-Pfad: Testmarker `isTest` / `correlationId` / `cleanupStatus` / `cleanedAt` (BE#39). Zeilen werden markiert, nicht gelöscht. Der Altbestand ohne Marker bleibt.
- Risiko: `handwerkflows-test-db` läuft im Free-Plan am 2026-10-25T04:44Z ab. Das Upgrade übernimmt der BOSS; Erinnerungen am 15.10. und 22.10.

## Punkt 5 – Automatisches E2E-Cleanup: ZURÜCKGENOMMEN (2026-10-01/02, BOSS-Entscheidung)
> Nachtrag 2026-10-02: Der Abschnitt unten beschreibt den Stand vom 2026-09-30 und bleibt als Verlauf erhalten. Er gilt nicht mehr.
> - BOSS 2026-10-01: In n8n und Google Drive wird nichts gelöscht.
> - FE#57 (merged 2026-10-01 20:06 UTC): Das automatische Test-Cleanup wurde aus dem Business-E2E entfernt; Drive- und n8n-Artefakte bleiben erhalten. BELEGT (Git).
> - BE#51 → main `7c016be` (merged 2026-10-02 04:59 UTC), Render `dep-davjkplckfvc73brevng`: Route `/api/orchestrator/test-cleanup`, `lib/orchestrator/test-cleanup.ts` und die Drive-Trash-Funktionen sind entfernt; `test-mark` bleibt. BELEGT (Git, Render).
> - Seitdem melden E2E-Läufe `cleanup.status: CLEANUP_DISABLED` (z. B. Real E2E 36974817418, Job `cmuqlj1kb00004ugq1jil0pd1`). BELEGT.
> - Folge: Der 60-Node-Lauf 36905703518 (Job `cmupuxez10003101ebc4hzd7x`, `CLEANUP_OK`) hat heute keine Pipeline-Dateien mehr in Drive. BELEGT (Drive-Suche 2026-10-02).

Stand 2026-09-30 (Verlauf):
- BE#39 gemergt (main `5a38424`), Render-Deploy `dep-daulbim0tbcc73dpdaig`, Migration `20260930120000_add_test_cleanup_fields` angewendet (Render-Log). BELEGT.
- FE#37 gemergt (main `1a64751`); Cloudflare-Version 4f236955-8e6c-418f-9b21-49463cb4642c. BELEGT.
- Abnahme (2 aufeinanderfolgende Läufe, 0 Reste):
  | Lauf | Job | n8n | Drive | Status |
  |---|---|---|---|---|
  | Real E2E 36760537296 | cmuogej3h0000cngv4gnm7917 | ndOKbBIF410wwHKi DELETED | 5 TRASHED | CLEANUP_OK |
  | Post-Deploy Gate 36760795799 | cmuogh4mg0001cngvlhs1h6t3 | xchgNbuY2vMEStP3 DELETED | 5 TRASHED | CLEANUP_OK, POST_DEPLOY_PRODUCTION_E2E=PASS |
- Evidence-Artifact 11119370173.
- n8n-Nachinventar: 33 Workflows, 0 Executions, keine Reste der beiden Läufe. Drive-Nachinventar: keine Datei der beiden Jobs in 01–04. BELEGT.
- Status der DB-Zeilen (`cleanupStatus`) NICHT GEPRÜFT (kein DB-Zugriff); die API-Antwort lautete CLEANUP_OK.
- `E2E_KEEP_ARTIFACTS` wird nicht gesetzt (BOSS-Entscheidung).

## Offene Aufräumpunkte
- Branches löschen (BOSS-GO 2026-09-30): BE `feat/r-05-e2e-test-cleanup-20260930`, FE `feat/r-05-s4-e2e-cleanup-20260930`, FE `evidence/r-01-diagnose-prs-archiv-20260930`. Head = gemergter PR-Head geprüft. Die Löschung aus der Agent-Umgebung wurde technisch blockiert und ist noch offen.
- BE `ops/r-02d-n8n-readonly-inventory-20260930` bleibt bis zum letzten Nachinventar (nach der n8n-Löschung durch den BOSS). Danach werden der Branch, der n8n-API-Key und die Secrets `N8N_TEST_INSTANCE_URL` / `N8N_TEST_API_KEY` entfernt.
