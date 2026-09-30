# R-02c/R-02d – n8n Cleanup: Status und Nachinventar-Versuch (ENTWURF)

Stand: 2026-09-30 · Roadmap Punkt 2/20 · Status: R-02c ausgeführt laut BOSS, NICHT VERIFIZIERT

## R-02c – Löschung
- Ausführung: manuell durch BOSS in der n8n-UI (adaptable-gibbon.pikapod.net), Grundlage R-02b Kategorie A (16) + D (2).
- BOSS-Meldungen: „Sind alle gelöscht“, „Ich habe alle gelöscht“.
- Umfang („alle“ = 18 laut Liste oder alle 33): NICHT GEKLÄRT.
- Kein Löschprotokoll je Objekt vorhanden.

## R-02d – Read-only-Nachinventar (Versuch)
- Branch: `ops/r-02d-n8n-readonly-inventory-20260930` (BE-Repo), Commit 6e34c47d13f1a293e63e792b7e7abbe551feac01, Basis main 60da25e.
- Skript: ausschließlich GET (0 × POST/DELETE/PUT/PATCH per grep), fail-closed ohne Konfiguration (lokal Exit 2 geprüft).
- Run 36752507546, Job 110014393646: **failure** – `BLOCKED: missing N8N_TEST_INSTANCE_URL or N8N_TEST_API_KEY` (Exit 2).
- Root Cause (BELEGT durch Log): GitHub-Repo-Secrets `N8N_TEST_INSTANCE_URL` / `N8N_TEST_API_KEY` sind im BE-Repo leer bzw. nicht gesetzt.
  ANNAHME: Die Werte existieren nur als Render-Env-Variablen von srv-daqk0sp7lnhs73d9nr7g (Code liest sie dort, agents.ts:199-200).
- Keine Änderung an n8n. Kein Render-Deploy (Branch ≠ main).

## Governance-Befund
- README.md:59-60 (BE): „The n8n TEST instance … must be separate from any customer or production n8n instance.“
- Live-Befund (Screenshot BOSS 18:31): Instanz enthält „VantomLabs SHK Kundenanfrage-Assistent v1.1“ (created 23.09.) und „Agent Swarm“ (created 24.09.) → Widerspruch zur Regel, sofern diese produktiv genutzt werden. Entscheidung BOSS.

## Offen für Abschluss Punkt 2
1. Nachinventar (Workflows Total + Liste, Executions, Archiv) – per Screenshot ODER per R-02d-Rerun nach Setzen der Secrets (Human Gate).
2. Soll: 15 Workflows; 5 Anker (qqIKS7MbuaZbBQ9n, bBfZCFELgcHkSTFF, iZOuDOeXqXdAGKj9, A11gX6i1Nh7ISN06, B3AAGdSdABVK8oAC) vorhanden; 16 A-IDs → 404; 0 × TEMP PR36.
3. Aufräumen des ops-Branches (Branch-Löschung = Human Gate).
