# R-02a – n8n-Testobjekte: Soll-Inventar aus Evidence (ENTWURF, read-only)

Stand: 2026-09-30 · Roadmap Punkt 2/20 · Status: BLOCKED für Live-Abgleich (kein n8n-Zugang in Builder-Umgebung)
Human Gate: Nichts gelöscht, nichts deaktiviert, kein Zugriff auf n8n erfolgt.

Quellen: Drive 03-TEST Testreports (21 Dateien, Inhalt gelesen), FE evidence/*.md, release/release-manifest.json, BE-Code.
Testmarker laut Code (BE lib/orchestrator/n8n-native.ts:52,90): Workflow-Name `HF TEST · <source> · <jobId[:12]>`, Webhook-Pfad `handwerkflows-test-<40hex>`, Evidence-Node mit __hfJobId.
Cleanup laut Code: nur best-effort DEACTIVATE (agents.ts:195) → alle unten gelisteten Workflows existieren vermutlich noch (ANNAHME, live zu prüfen).

| # | jobId | n8n importedId | executionId | Drive-Testreport erstellt (UTC) | in Repo-Evidence | Evidence-Anker |
|---|---|---|---|---|---|---|
| 1 | cmuh65gdm000033lz59wtkm57 | qmMoOMD511LTPhtt | 3 | 2026-09-26T18:19 | nein | – |
| 2 | cmuk5puc80000cc444v1jzuat | NvLdMdZ8HJXJBSfV | 6 | 2026-09-27T18:33 | nein | – |
| 3 | cmukb7kma000012x8gwq7jdq1 | tRClfK9r2Z3DZDr3 | 7 | 2026-09-27T21:12 | nein | – |
| 4 | cmukdh8bg000040vwk1831h1g | Ctw8rBsgQpYA2oCp | 8 | 2026-09-27T22:10 | nein | – |
| 5 | cmukf9w8p000014j5ypk5an5y | QxYKwuAYerhW4YCb | 9 | 2026-09-27T23:01 | nein | – |
| 6 | cmukh1so40000grpzqt0wkkxa | K7FKTz89WHzGKYNw | 10 | 2026-09-27T23:50 | nein | – |
| 7 | cmukh5ylt0002grpz9phsemg3 | lFtFFqbYviqOb0o0 | 12 | 2026-09-27T23:54 | nein | – |
| 8 | cmukhkowl0000df1zq2on6q1n | oSnbC2zK1UOvHA8j | 13 | 2026-09-28T00:05 | nein | – |
| 9 | cmukxjt4n0000nms2ev9254in | dQz7P5icvnj03Wxs | 14 | 2026-09-28T07:32 | nein | – |
| 10 | cmul2mek40002nms26gjijbql | AdNHGWfMNCdo0ZXF | 16 | 2026-09-28T09:55 | nein | – |
| 11 | cmul2ywq20003nms2lp7tr3u1 | PImYct4CrP6f5Wk4 | 17 | 2026-09-28T10:04 | nein | – |
| 12 | cmulwajfs0000xscchqsbr1cq | Q2qF7XbR1A9N82Md | 20 | 2026-09-28T23:45 | nein | – |
| 13 | cmulwh3nb0001xsccndho402e | qqIKS7MbuaZbBQ9n | 21 | 2026-09-28T23:50 | ja (M1_PRODUCTION_EVIDENCE) | JA |
| 14 | cmulwnkjt0002xscc1hc4a5t2 | bBfZCFELgcHkSTFF | 22 | 2026-09-28T23:55 | ja | JA |
| 15 | cmulwpe1b0003xscckkfy880h | iZOuDOeXqXdAGKj9 | 23 | 2026-09-28T23:56 | ja | JA |
| 16 | cmulwry8x0004xsccaofpjzhu | A11gX6i1Nh7ISN06 | 24 | 2026-09-28T23:58 | ja | JA |
| 17 | cmun5u6ol000313vmesll7g72 | N3xoZrZB315jZR1i | 25 | 2026-09-29T21:00 | nein | – |
| 18 | cmun7tccd000413vmpqsxfd3t | tjmgN2h9lnhVVaCT | 26 | 2026-09-29T21:55 | nein | – |
| 19 | cmun7vi43000513vmstekhbie | Hz3bXcsGhzKxocRa | 27 | 2026-09-29T21:57 | nein (nur Agentenanweisung §4.4) | – |
| 20 | cmun9b5gc000613vmltmyi5r5 | jBBT1QVJtYAVCFmx | 28 | 2026-09-29T22:37 | nein | – |
| 21 | cmun9dco4000713vmm204gj8l | B3AAGdSdABVK8oAC | 29 | 2026-09-29T22:39 | ja (Release-Manifest, Human Gate, Freeze) | JA – Release-definierend |

## Lücken / UNKLAR
- Execution-IDs ohne Zuordnung: 1, 2, 4, 5, 11, 15, 18, 19 (und ggf. >29). Herkunft unbekannt (fehlgeschlagene Läufe, Diagnosen, manuelle Tests?) → UNKLAR, nicht anfassen.
- Mögliche Diagnose-Objekte: „TEMP PR36 webhook registration diagnostic“ (BE#37, Ausführung NOT_PROVEN); „TEMP M1 import diagnostic <ts>“ (Branch test/m1-n8n-import-diagnostic-60da25e-20260929, Skript löscht per DELETE; Run 36628868967 failure, Run 36628990473 success → Restobjekt bei Failure möglich).
- Kriterium „Test-Account/Test-Tenant“: System hat nur OWNER-Auth, kein Besitzerfeld → für alle 21 nicht eindeutig belegbar. Kriterium „Testlauf-Zeitfenster“: Zuordnung jobId → CI-Run-ID nur für Evidence-Jobs (#13–16, #21) belegt.
- Ergebnis nach Regel 5 (alle vier Kriterien): aktuell KEIN Objekt vollständig als löschbar belegt.

## Evidence-Anker
#13–16 und #21 werden von Repo-Evidence referenziert → vor jeder Löschung Export, Entscheidung BOSS.
