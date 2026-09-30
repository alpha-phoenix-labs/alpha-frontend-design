# Löschprotokoll (laufend)

Regel (BOSS, 2026-09-30): Jede Löschung wird hier festgehalten, egal ob manuell durch den BOSS oder ausgeführt durch Claude. Das gilt auch für offene Löschaufträge. Am Ende jeder Session gibt es ein Handout.
Einträge werden nur ergänzt, nie entfernt. Status: OFFEN · ERLEDIGT · ERLEDIGT (ANNAHME) = nicht belegt.

## A. Offen – manuell durch BOSS

### A1. Git-Branches (GO 2026-09-30; aus der Agent-Umgebung blockiert) – ERLEDIGT
Weg: GitHub → Repo → Branches → Papierkorb-Symbol. Jeder Stand entspricht genau dem gemergten PR-Head (geprüft 2026-09-30).
| Repo | Branch | SHA | PR | Status |
|---|---|---|---|---|
| alpha-phoenix-labs/n8n-workflow-factory | `feat/r-05-e2e-test-cleanup-20260930` | 5db3d239dfc1ac56796b49f752bc13c68276e297 | BE#39 (merged) | ERLEDIGT 2026-09-30 (BOSS) |
| alpha-phoenix-labs/alpha-frontend-design | `feat/r-05-s4-e2e-cleanup-20260930` | 38a0ac258bb0eae187fa582c39e664af36cfdbea | FE#37 (merged) | ERLEDIGT 2026-09-30 (BOSS) |
| alpha-phoenix-labs/alpha-frontend-design | `evidence/r-01-diagnose-prs-archiv-20260930` | 938325df99c6ef26de1b8fdc5470d62e9794bab6 | FE#36 (merged) | ERLEDIGT 2026-09-30 (BOSS) |

### A2. n8n-Workflows (adaptable-gibbon.pikapod.net) – 20 Stück
Vorher die beiden Workflows aus Kategorie E über „Download“ als JSON sichern.
| # | ID | Name (Kurz) | Kategorie | Status |
|---|---|---|---|---|
| 1 | qmMoOMD511LTPhtt | Minimal E2E Test Workflow · cmuh65gdm000 | A | OFFEN |
| 2 | NvLdMdZ8HJXJBSfV | Minimal Response Workflow · cmuk5puc8000 | A | OFFEN |
| 3 | tRClfK9r2Z3DZDr3 | Simple Workflow · cmukb7kma000 | A | OFFEN |
| 4 | Ctw8rBsgQpYA2oCp | Minimal Webhook Response · cmukdh8bg000 | A | OFFEN |
| 5 | QxYKwuAYerhW4YCb | Minimal JSON Response Workflow · cmukf9w8p000 | A | OFFEN |
| 6 | K7FKTz89WHzGKYNw | Minimal Workflow · cmukh1so4000 | A | OFFEN |
| 7 | lFtFFqbYviqOb0o0 | Email workflow mit priority · cmukh5ylt000 | A | OFFEN |
| 8 | oSnbC2zK1UOvHA8j | Minimal Workflow · cmukhkowl000 | A | OFFEN |
| 9 | dQz7P5icvnj03Wxs | Webhook to JSON Response · cmukxjt4n000 | A | OFFEN |
| 10 | AdNHGWfMNCdo0ZXF | Minimal Webhook Workflow · cmul2mek4000 | A | OFFEN |
| 11 | PImYct4CrP6f5Wk4 | Minimal Workflow · cmul2ywq2000 | A | OFFEN |
| 12 | Q2qF7XbR1A9N82Md | Webhook Response Workflow · cmulwajfs000 | A | OFFEN |
| 13 | N3xoZrZB315jZR1i | Webhook Response Workflow · cmun5u6ol000 | A | OFFEN |
| 14 | tjmgN2h9lnhVVaCT | Webhook Response Workflow · cmun7tccd000 | A | OFFEN |
| 15 | Hz3bXcsGhzKxocRa | Webhook Response Workflow · cmun7vi43000 | A | OFFEN |
| 16 | jBBT1QVJtYAVCFmx | Webhook Response Workflow · cmun9b5gc000 | A | OFFEN |
| 17 | pniunvHXh0Y2ZJtU | TEMP PR36 webhook registration diagnostic | D | OFFEN |
| 18 | RTTB5xViy6iI3dt7 | TEMP PR36 webhook registration diagnostic | D | OFFEN |
| 19 | 2HRwNqSmBfuRMBwc | VantomLabs SHK Kundenanfrage-Assistent v1.1 | E (BOSS 8e: löschen) | OFFEN |
| 20 | u1BHUlVbltZXEwq0 | Agent Swarm | E (BOSS 8e: löschen) | OFFEN |
Nicht löschen: die 5 Anker-Workflows (qqIKS7MbuaZbBQ9n, bBfZCFELgcHkSTFF, iZOuDOeXqXdAGKj9, A11gX6i1Nh7ISN06, B3AAGdSdABVK8oAC) und die 8 Workflows der Kategorie C (UNKLAR, noch keine Entscheidung).
Soll danach: 13 Workflows.

### A3. Erst nach A2 und der letzten Prüfung durch Claude
| Was | Wo | Wer | Status |
|---|---|---|---|
| Branch `ops/r-02d-n8n-readonly-inventory-20260930` (6e34c47d13f1a293e63e792b7e7abbe551feac01) | BE-Repo | BOSS (oder Claude, falls freigeschaltet) | OFFEN |
| n8n-API-Key (neu erstellt am 2026-09-30 für die Inventur) | n8n → Settings → API | BOSS | OFFEN |
| GitHub-Secrets `N8N_TEST_INSTANCE_URL`, `N8N_TEST_API_KEY` | BE-Repo → Settings → Secrets → Actions | BOSS | OFFEN |

## B. Erledigt

| Datum | Was | Umfang | Wer | Wiederherstellbar | Beleg |
|---|---|---|---|---|---|
| 2026-09-30 | FE#28, BE#35, BE#37 geschlossen (nicht gelöscht) | 3 PRs | Claude (GO) | ja (Reopen) | R-01 |
| 2026-09-30 | n8n-Executions | alle, inkl. der Anker 21, 22, 23, 24, 29 | BOSS | nein | ERLEDIGT (ANNAHME); R-02d: total=0 |
| 2026-09-30 | Drive Batch 1 (01/02/03) | 42 Dateien → Papierkorb | Claude (GO) | ja, ca. 30 Tage über den Drive-Papierkorb | R-03b |
| 2026-09-30 ~18:08Z | Drive 04-FERTIG | 42 Dateien inkl. 10 Evidence-Anker | BOSS („Habe sie gelöscht“) | unbekannt | R-03b |
| 2026-09-30 | Drive Batch 2 (UNKLAR-Jobs cmukb7kma, cmukh5ylt) | 6 Dateien → Papierkorb | Claude (GO 8c) | ja, ca. 30 Tage | R-00 |
| 2026-09-30 ~19:20Z | Git-Branches `feat/r-05-e2e-test-cleanup-20260930` (BE), `feat/r-05-s4-e2e-cleanup-20260930` (FE), `evidence/r-01-diagnose-prs-archiv-20260930` (FE) | 3 Branches (alle gemergt) | BOSS (GitHub-UI) | ja (Restore-Button am geschlossenen PR) | `git ls-remote` 2026-09-30: nicht mehr vorhanden |
| 2026-09-30 | n8n-Testworkflows ndOKbBIF410wwHKi, xchgNbuY2vMEStP3 | 2 (automatisches E2E-Cleanup) | System (R-05) | nein | Runs 36760537296, 36760795799 |
| 2026-09-30 | Drive-Dateien der 2 E2E-Jobs | 10 → Papierkorb (automatisches E2E-Cleanup) | System (R-05) | ja, ca. 30 Tage | wie oben |

## C. Abweichungen beim automatischen E2E-Cleanup

| Datum | Lauf | Job | Befund | Nachprüfung | Status |
|---|---|---|---|---|---|
| 2026-09-30 19:38Z | Real E2E 36766853195 (FE `2a6760d`, BE `6835adb`) | cmuoibljs000038o1w9zcx4bg | `CLEANUP_INCOMPLETE`: n8n OoVSr582nMZDGjaG DELETED; Drive 3/5 TRASHED; `1dxO--vH7r2rPDbp_flFT9PsneECfCmDV` (testreport) und `1xiKjs7Q46K5CkRHjbIxmf4muFtp3Ci1d` (final-workflow) = `DRIVE_REQUEST_FAILED` (keine HTTP-Antwort, `drive-api.ts:129`) | 2026-09-30 ~19:45Z, read-only per Drive-Connector: beide IDs „not found“, Suche nach der Job-ID 0 Treffer. Der Connector zeigt Papierkorb-Dateien nicht an (vgl. R-03b, Probe #1) | ERLEDIGT (ANNAHME: im Papierkorb; Papierkorb vs. endgültig gelöscht NICHT UNTERSCHEIDBAR). Ursachen-Fix: BE#41 (Rückprüfung nach verlorener Antwort) |

Hinweis: Ab R-05 räumt jeder E2E-Lauf seine eigene n8n-Testkopie und seine Drive-Dateien automatisch auf. Diese Löschungen stehen im `evidence.cleanup` des jeweiligen Laufs und werden hier nur bei Abweichungen einzeln eingetragen.
