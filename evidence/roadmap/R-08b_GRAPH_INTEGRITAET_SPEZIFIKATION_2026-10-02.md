# Roadmap Punkt 8b – Graph-Integrität (Hardening): Umsetzungsvorbereitung

Stand: 2026-10-02 · Quelle: `CRAFTFLOW_POST_M1_ROADMAP.md`, Punkt 8b (BOSS-Entscheidung 2026-10-02, QA-Audit)
Kennzeichnung: BELEGT = geprüft · ANNAHME · NICHT GEPRÜFT
Status: **VORBEREITET** – nur Dokumentation; keine Implementierung, kein Validator geändert. Umsetzung nur mit eigenem GO.

## Ist-Stand im Code (BELEGT, BE `5db194c`, `lib/orchestrator/core.ts`)
Reihenfolge in `validateWorkflow`:
1. Nodes: Schema, eindeutige IDs/Namen, genau ein Trigger (`REQUIRE_SINGLE_TRIGGER`) bzw. ein Error-Trigger im Fehler-Workflow.
2. Verbindungen (`core.ts:145-161`): Quelle existiert, Kanal `main`, Ziel ist Text-`node` eines existierenden Nodes, `type: "main"`, `index` ganzzahlig ≥ 0, Ziel ist kein Trigger.
3. Ausgänge (`core.ts:163-175`): IF-Zweige, aktive Fehlerausgänge und der Error-Trigger müssen verbunden sein; Stop and Error hat keinen Ausgang.
4. `assertAcyclic` (`core.ts:225ff.`): keine Zyklen.

Nicht geprüft: Erreichbarkeit vom Trigger, isolierte Nodes, doppelte Verbindungen.

## Regeln 8b (Vorschlag)
| Regel | Definition | Fehlercode (Vorschlag, ohne Namen) | Stelle |
|---|---|---|---|
| R1 Reachability | Jeder Node ist vom (einzigen) Trigger über `main`-Verbindungen erreichbar; im Fehler-Workflow vom Error-Trigger. | `UNREACHABLE_NODE` | nach Schritt 3, vor `assertAcyclic` |
| R2 Isolierte Nodes | Ein Node ohne eingehende und ohne ausgehende Verbindung (außer dem Trigger eines 1-Node-Workflows). Folgt aus R1; eigener Code nur für die Diagnose. | `ISOLATED_NODE` | wie R1, vor R1 geprüft |
| R3 Doppelte Verbindungen | Dieselbe Kante (Quelle, Ausgang-Index) → (Ziel, Eingang-Index) kommt mehr als einmal vor. | `DUPLICATE_CONNECTION` | in Schritt 2 |

Für die interne BUILDER-Rückmeldung: Node-Index bzw. Verbindungspfad (z. B. `connections[3].main[0][1]`), nie Namen oder Werte – wie `BUILDER_REJECT` seit BE#54.

## Offene Entscheidung (BOSS)
- R3 Grenzfall: IF mit „wahr“ und „falsch“ auf **denselben** Ziel-Node (zwei verschiedene Ausgänge). Nach der Definition oben ist das **keine** doppelte Verbindung (verschiedene Ausgänge). Soll es trotzdem verboten sein? Bis zur Entscheidung: erlaubt.

## Auswirkungen und Risiken
- Strengere Prüfung kann BUILDER-Wiederholungen erhöhen, wenn das Modell solche Graphen erzeugt. Ob die Läufe 36994286358 (40) und 36994530333 (60) die Regeln verletzen würden: NICHT GEPRÜFT (Workflows liegen in Drive; Prüfung vor Umsetzung vorgesehen, s. Abnahme).
- `repairConnectionIds` (ID→Name) läuft vor der Prüfung; R1–R3 prüfen den reparierten Graphen.
- Der Fehler-Workflow (`buildErrorWorkflow`, 3 Nodes in Reihe) erfüllt R1–R3 (ANNAHME aus dem Code, Test vorgesehen).
- R-20-QUALITY v1 bleibt unverändert; Graph-Integrität erst in v1.1 für spätere Läufe.

## Abnahme (vor Merge)
1. Je Regel ein Negativtest, der auf dem alten Code durchläuft (Lücke belegt) und auf dem neuen Code mit dem neuen Fehlercode abgelehnt wird.
2. Positivtests: Referenz-Workflow aus `__tests__/qg001.test.cjs`, Fehler-Workflow, lineare Ketten 2/40/50 Nodes, IF-Verzweigung mit Zusammenführung.
3. Offline-Prüfung der bestehenden Drive-Workflows (40/60 Nodes, Standardauftrag) gegen R1–R3, nur lesen.
4. Nach Deploy: Regression 40 und Betriebsgrenze 50 E2E mit Drive-Nachweis.

## Nicht Bestandteil
Readback Comparison (→ Punkt 9), Branch-/Depth-Limits (→ Punkt 18), Graph-Optimierung (→ Backlog), Diagnose-Logging für Verbindungsfehler (T1-Befund; eigener Vorschlag, eigenes GO).
