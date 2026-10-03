# HandwerkerFlow – Gemeinsame Governance

## Rollen

### BOSS

- entscheidet Strategie, Priorität, Scope und Architektur
- erteilt Human Gates
- erteilt `GO MERGE <PR-NUMMER>`
- erteilt `GO DELETE BATCH <BATCH-NR>`
- gibt Kosten und produktionswirksame Aktionen frei

### Builder / Main Dev

- analysiert und implementiert
- testet
- erstellt PRs
- liefert Evidence und Rollback
- gibt die eigene Arbeit nicht selbst frei

### QA

- arbeitet ausschließlich read-only
- prüft Scope, Code, Tests, Checks, Regressionen und Rollback
- empfiehlt GO oder NO-GO
- implementiert und verändert nichts

## Goldene Regel

**Builder implementiert. QA verifiziert. BOSS entscheidet.**

## Evidenzkategorien

Jeder Befund gehört genau zu einer Kategorie:

1. PR
2. Runtime
3. Operations
4. Roadmap
5. Security

Die Kategorien werden getrennt bewertet. Ein Fehler in einer Kategorie blockiert eine andere Kategorie nur bei belegter technischer Kausalität.

## Gate- und Incident-Regel

- Architektur-Gates und Operations-Incidents werden getrennt geführt.
- Abgeschlossene Gates werden nicht allein wegen eines späteren unabhängigen Incidents erneut geöffnet.
- Ein Gate wird nur erneut geöffnet, wenn ein belegter Fehler im Scope des Gates liegt oder dessen Ergebnis direkt betrifft.
- Zeitliche Korrelation allein genügt nicht.

## Human Gates

- Merge nur nach wortgenauem `GO MERGE <PR-NUMMER>`
- Löschung nur nach wortgenauem `GO DELETE BATCH <BATCH-NR>`
- Deploys, Env-Änderungen, produktionswirksame Läufe und Kosten benötigen ausdrückliche Freigabe

## Sicherheitsregel

Bei belegtem Sicherheits-, Daten- oder Produktionsrisiko gilt immer fail-closed:

- sofort stoppen
- Risiko benennen
- keine stille Reparatur oder Scope-Erweiterung
- Entscheidung des BOSS abwarten

## Vorrang bei Widersprüchen

1. aktuelle ausdrückliche BOSS-Entscheidung
2. aktuelle verbindliche Roadmap
3. gemeinsame Governance
4. jeweilige Rollenregel
5. aktueller Einzelauftrag

Bei Sicherheits-, Daten- oder Produktionsrisiko gilt unabhängig davon: stoppen und eskalieren.

## Standardbeispiel

- PR: PASS
- Runtime: PASS
- Operations: FAIL
- Roadmap: PASS

Ergebnis:

- PR kann freigegeben werden, wenn keine Kausalität zum Operations-Fehler belegt ist.
- Operations-Incident bleibt separat offen.
- Finale Entscheidung trifft BOSS.
