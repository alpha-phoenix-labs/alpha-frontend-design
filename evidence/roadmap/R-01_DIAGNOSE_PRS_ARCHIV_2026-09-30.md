# R-01 – Diagnose-PRs FE#28 / BE#35 / BE#37 – Archiv-Evidence

Stand: 2026-09-30 (read-only erhoben) · Roadmap Punkt 1/20 · Status: abgenommen
Repo-SHAs: FE main 88121705a110c2f2362244fc39005defdc4d2777 · BE main 60da25e02dd097a611058a206ed704022eb47c38
Human Gate (Erhebung): Durch die Erhebung kein Merge, kein Deploy, kein Tag ausgeführt. Keine Branch-Löschung.

| PR | Titel | Vorher | Nachher (closed_at UTC) | merged | Head-SHA | Archiv-Kommentar |
|---|---|---|---|---|---|---|
| FE#28 | M1 diagnostic: expose BLOCKED business E2E reason | open/draft | closed 2026-09-30T07:29:13Z | nein | b980e8eec7d8d2bbe362192b10938bf04e44d27f | issuecomment-5906360460 |
| BE#35 | M1: publish n8n test workflow before production webhook | open/draft | closed 2026-09-30T07:29:39Z | nein | c34d78e025efe093f94065eb98ef35e257bc6924 | issuecomment-5906366949 |
| BE#37 | test: temporary DB-free n8n diagnostic for PR36 | open/draft | closed 2026-09-30T07:29:59Z | nein | 6b453a6ac1f3027c3e069db2f9d968cffe236e21 | issuecomment-5906371768 |

## Überholt-/Enthalten-Prüfung (gegen main, git clone)
- FE#28 (2 Dateien): Branch-Trigger `diag/m1-blocked-e2e-20260928` in real-e2e.yml → auf main 0 Treffer; Felder backendErrorMessage/backendTestReport in scripts/real-business-e2e.mjs → auf main 0 Treffer. Nicht enthalten, überholt durch Production-E2E Run 36640752286.
- BE#35 (3 Dateien): /publish-/unpublish-Variante → auf main 0 Treffer. Nicht übernommen; ersetzt durch BE#36 (05a76fc88a689d79602b28646efab6611f73b595, Vorfahr von main: ja).
- BE#37 (3 Dateien): Retry-Logik `isRetryableWebhookRegistrationError` → auf main vorhanden (via BE#36). scripts/pr36-direct-n8n-diagnostic.mjs → nicht auf main. Ausführung des Skripts gegen n8n: NOT_PROVEN.

## Noch relevante Erkenntnis (für Punkt 2)
- BE#37-Skript würde n8n-Workflow „TEMP PR36 webhook registration diagnostic“ (Pfad handwerkflows-pr36-*) anlegen und nur deaktivieren. Falls je ausgeführt → Restobjekt in n8n möglich. In R-02 Inventar prüfen.

## Branch-Befund (nur Befund, keine Löschung)
Alle drei Head-Branches existieren, Head = PR-Head-SHA:
- FE diag/m1-blocked-e2e-20260928 → b980e8e
- BE fix/n8n-publish-webhook-registration-20260929 → c34d78e
- BE test/pr36-direct-n8n-diagnostic-20260929 → 6b453a6
Löschung technisch unkritisch (Inhalt in PR-Refs erhalten), erfordert aber separates GO.

## Abnahme
- BOSS-Entscheidung 2026-09-30 (Chat, Option 1A): Punkt 1 abgenommen; Evidence als PR ausschließlich unter evidence/**; GO für Push und Merge dieser Datei.

## Offen
- GO-Nachweis für das Schließen am 2026-09-30 07:29 UTC: NICHT GEPRÜFT (nicht in Repo/PR belegt).
