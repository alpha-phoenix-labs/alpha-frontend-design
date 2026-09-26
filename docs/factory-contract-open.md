# Factory-Vertrag: offene Punkte

Stand: 26.09.2026. Gilt für `src/types/factory/`, `src/services/factory/` und `src/store/factory/`.
Die Typen sind contract-first angelegt und bewusst minimal. Alles, was die Referenzen (UI-Plan, Spatial-Core-Referenz, Zukunft-des-Interfaces) nicht festlegen, steht hier und muss vor der Live-Anbindung mit der Factory geklärt werden (Human Gate: API-Vertrag anfordern).

## Fehlender HTTP-Endpunktvertrag

- Es gibt keine vereinbarten Pfade, Methoden, Payloads, Authentifizierung oder Fehlerformate der Factory-API.
- Deshalb existiert kein HTTP-Client und es stehen keine Endpunkt-Strings im Code.
- `getFactoryServiceSelection()` liefert immer `mode: 'mock'`:
  - `reason: 'baseUrlMissing'`, wenn `VITE_FACTORY_API_BASE_URL` leer oder nicht gesetzt ist,
  - `reason: 'httpContractOpen'`, wenn eine Basis-URL gesetzt ist, der Endpunktvertrag aber fehlt.
- Ein späterer Live-Adapter implementiert das Interface `FactoryService`; die Auswahl erfolgt nur in `src/services/factory/index.ts`.

**Update Modus mock/http:** Inzwischen steuert `VITE_FACTORY_MODE` die Auswahl. Leer oder nicht gesetzt: Mock (unverändert). `http`: `HttpFactoryService` gegen `VITE_FACTORY_API_BASE_URL`, angegeben als Origin ohne `/api` (HTTPS, außer localhost; ohne Query, Hash und Zugangsdaten). Die Endpunkte liegen unter `<URL>/api/orchestrator`. `http` ohne gültige URL oder ein unbekannter Modus liefert bei jedem Aufruf `FACTORY_CONFIG_INVALID`, ohne Fallback auf den Mock.

## Offene Felder je Typ

| Typ | Offen |
| --- | --- |
| `WorkflowRequest` | Kontext (Kunde, Projekt), Anhänge, Zielsystem, Identität des Anfragenden, Idempotenzschlüssel |
| `FactoryJob` | Format der Job-ID, Fortschrittsangabe, Verweise auf Generierungs-, Test- und Ausführungs-IDs, ob `error` auch bei `blocked` gesetzt wird |
| `WorkflowGenerationResult` | Name, Zusammenfassung, Node-Anzahl, Version; die Workflow-Definition bleibt für die UI bewusst opak |
| `TestResult` | Einzelne Testfälle und Details, Startzeitpunkt, Testlauf-ID, welche `TestMode`-Werte die Factory tatsächlich anbietet |
| `WorkflowExecutionResult` | Ausgabedaten, Trigger-Art, welche `JobStatus`-Werte für eine Ausführung gültig sind |
| `HumanGateState` | Kommentar, Identität des Freigebenden, Timeout, Payload von `submitApproval` |
| `WorkflowProductionMetrics` | Kosten je Modell und je Agent, Zusammensetzung von `platformCostMicros`, ob die Factory Micros liefert oder die Umrechnung im Live-Adapter erfolgt |
| `ApiError` | Katalog der Server-Fehlercodes, Retry-Hinweis, Detail-Payload |

## Human Gate: Ablehnung undefiniert

- `JobStatus` kennt `awaiting_human` und `approved`, aber keinen Ablehnungszustand.
- `submitApproval(jobId)` kann daher nur freigeben. Ob eine Ablehnung zu `failed`, `blocked` oder zurück zu `generating` führt und welche Begründung mitgeschickt wird, ist offen.

## Produktionsmetriken pro Workflow (Punkt H)

Typ `WorkflowProductionMetrics` in `src/types/factory/productionMetrics.ts`, geliefert von `FactoryService.getProductionMetrics(jobId)` (Mock und künftiger Live-Adapter über dasselbe Interface), im Store unter `productionMetrics[jobId]`.

| Feld | Bedeutung |
| --- | --- |
| `jobId`, `workflowId?` | Job und erzeugter Workflow; `workflowId` erst nach `generated` |
| `currency` | Währung aller Beträge, derzeit nur `'USD'` |
| `apiCostMicros` | API-Kosten der Modellaufrufe |
| `platformCostMicros` | Plattformanteil (Rechenzeit, Testausführung) |
| `totalCostMicros` | Gesamtproduktionskosten, immer `apiCostMicros + platformCostMicros` (`totalProductionCostMicros()` in `src/services/factory/productionMetrics.ts`) |
| `tokensIn`, `tokensOut` | Input- und Output-Tokens |
| `modelCalls`, `agentCalls` | Modell- und Agentenaufrufe |
| `productionTimeMs` | Aktive Produktionszeit in Millisekunden, ohne Wartezeit am Human Gate |
| `testMode` | `TestMode`: `'mock'` (externe Systeme simuliert), `'dry_run'` (echte Nodes ohne schreibende Nebenwirkungen), `'live'` (echte Zielsysteme) |
| `testCount`, `passed`, `failed` | Geplante Tests sowie aktuell bestandene (PASS) und fehlschlagende (FAIL) Tests; `passed + failed <= testCount` |
| `retryLoops`, `repairLoops` | Unveränderte Wiederholungen fehlgeschlagener Tests und modellgestützte Reparaturen mit Neutest |
| `updatedAt` | Zeitpunkt der letzten Änderung |

- Beträge sind ganze Zahlen in Micros: 1 USD = 1.000.000 (`MICROS_PER_CURRENCY_UNIT`). Das vermeidet Rundungsdrift beim Summieren; die Anzeige rechnet in der UI um.
- Alle Werte sind kumulativ seit Einreichung und wachsen nur. `WorkflowRequest.testMode` und `TestResult.testMode` verwenden denselben Typ `TestMode`; `TestResult` enthält zusätzlich `retryLoops`.
- Der Mock liefert Metriken ab `queued`: Tokens, Aufrufe und API-Kosten wachsen anteilig in `generating`, `importing`, `testing` und `approved`; Tests, PASS/FAIL, Retry- und Reparaturschleifen entstehen erst in `testing` aus einer festen Ereignisfolge je Szenario; jede Reparatur kostet zusätzliche Tokens und Aufrufe. Der Plattformanteil ist proportional zur Produktionszeit. Beträge und Tarife des Mocks sind fiktiv.
- Offen für den Live-Vertrag: ob die Factory Micros oder Dezimalbeträge liefert, weitere Währungen, echte Tarife und die Zusammensetzung des Plattformanteils, Aufschlüsselung je Modell und Agent, ob abgelehnte oder abgebrochene Jobs weiter Kosten erzeugen.

## Erlaubte Übergänge und Endzustände

- Die elf `JobStatus`-Werte stehen fest, die Übergänge zwischen ihnen nicht.
- Der Mock nimmt an: `queued → generating → generated → importing → testing → awaiting_human → approved → completed`, Abzweige `testing → failed` und `importing → blocked`.
- Offen: ob `blocked` ein Endzustand ist oder fortgesetzt werden kann, ob `failed` und `completed` endgültig sind, ob Reparaturschleifen den Status zurücksetzen und wann `idle` vom Server gemeldet wird. Die UI verwendet `idle` nur für „kein Job vorhanden“.

## Polling oder Push

- Nicht festgelegt, ob Statusänderungen per Polling, Server-Sent Events, WebSocket oder Webhook an die UI gelangen.
- Aktuell: Polling über `useFactoryJobPolling(jobId, 1000)`, das `refreshJob` im Factory-Store aufruft. Das Polling endet erst beim Unmount oder bei `jobId = null`, weil keine Endzustände vereinbart sind.

## Typisierung in `vite-env.d.ts`

Benötigt (Zuständigkeit Alpha-Deploy), ausschließlich gelesen in `src/services/factory/index.ts`:

```ts
interface ImportMetaEnv {
  readonly VITE_FACTORY_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Dazu `.env.example` mit `VITE_FACTORY_API_BASE_URL=` ohne Wert. Der Wert landet im Browser-Bundle und darf keine Zugangsdaten enthalten.
