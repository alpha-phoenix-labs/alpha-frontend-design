# Factory-Vertrag: offene Punkte

Stand: 26.09.2026. Gilt für `src/types/factory/`, `src/services/factory/` und `src/store/factory/`.
Die Typen sind contract-first angelegt und bewusst minimal. Der bekannte Teil-2-Backend-Vertrag ist im HTTP-Adapter umgesetzt; weiterhin offene Felder und spätere UI-/Produktionsfragen werden in diesem Dokument ausdrücklich als offen markiert.

## Factory-Verbindung: Mock und HTTP

- `VITE_FACTORY_MODE` leer oder `mock` → `MockFactoryService`; damit bleibt das eingefrorene bisherige Verhalten erhalten.
- `VITE_FACTORY_MODE=http` + gültige `VITE_FACTORY_API_BASE_URL` → `HttpFactoryService`.
- Die Basis-URL ist ein Origin ohne `/api`; die vereinbarten Endpunkte liegen unter `<URL>/api/orchestrator` und `<URL>/api/orchestrator/approve`.
- `http` mit fehlender/ungültiger URL oder ein unbekannter Modus → `UnavailableFactoryService` mit `FACTORY_CONFIG_INVALID`; es gibt keinen stillen Rückfall auf Mock.
- `VITE_*`-Werte landen im Browser-Bundle und dürfen keine Secrets oder Zugangsdaten enthalten.
- Der konkrete `testReport`-Backendvertrag bleibt für Teil 3 offen; der Adapter rät keine fehlenden Felder und liefert bei nicht passender Struktur keinen Testbericht.

## Offene Felder je Typ

| Typ | Offen |
| --- | --- |
| `WorkflowRequest` | Kontext (Kunde, Projekt), Anhänge, Zielsystem, Identität des Anfragenden, Idempotenzschlüssel |
| `FactoryJob` | Format der Job-ID, Fortschrittsangabe, Verweise auf Generierungs-, Test- und Ausführungs-IDs, ob `error` auch bei `blocked` gesetzt wird |
| `WorkflowGenerationResult` | Name, Zusammenfassung, Node-Anzahl, Version; die Workflow-Definition bleibt für die UI bewusst opak |
| `TestResult` | Einzelne Testfälle und Details, Startzeitpunkt, Testlauf-ID, welche `TestMode`-Werte die Factory tatsächlich anbietet |
| `WorkflowExecutionResult` | Ausgabedaten, Trigger-Art, welche `JobStatus`-Werte für eine Ausführung gültig sind |
| `HumanGateState` | Kommentar, Identität des Freigebenden, Timeout, serverseitige Folgezustände nach einer Ablehnung |
| `WorkflowProductionMetrics` | Kosten je Modell und je Agent, Zusammensetzung von `platformCostMicros`, ob die Factory Micros liefert oder die Umrechnung im Live-Adapter erfolgt |
| `ApiError` | Katalog der Server-Fehlercodes, Retry-Hinweis, Detail-Payload |

## Human Gate: Approval und Ablehnung

- `submitApproval({ jobId, version, approve })` unterstützt sowohl Freigabe (`approve: true`) als auch Ablehnung (`approve: false`).
- Die Entscheidung ist versionsgebunden. Ein `VERSION_CONFLICT` wird nicht automatisch erneut freigegeben; zuerst muss der aktuelle Jobzustand geladen und eine neue menschliche Entscheidung getroffen werden.
- Welchen serverseitigen Folgezustand eine Ablehnung erzeugt, bestimmt das Backend; das Frontend erfindet dafür keinen neuen `JobStatus`.

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
  readonly VITE_FACTORY_MODE?: string;
  readonly VITE_FACTORY_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Dazu `.env.example` mit `VITE_FACTORY_API_BASE_URL=` ohne Wert. Der Wert landet im Browser-Bundle und darf keine Zugangsdaten enthalten.
