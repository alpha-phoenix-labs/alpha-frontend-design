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

## Offene Felder je Typ

| Typ | Offen |
| --- | --- |
| `WorkflowRequest` | Kontext (Kunde, Projekt), Anhänge, Zielsystem, Identität des Anfragenden, Idempotenzschlüssel |
| `FactoryJob` | Format der Job-ID, Fortschrittsangabe, Verweise auf Generierungs-, Test- und Ausführungs-IDs, ob `error` auch bei `blocked` gesetzt wird |
| `WorkflowGenerationResult` | Name, Zusammenfassung, Node-Anzahl, Version; die Workflow-Definition bleibt für die UI bewusst opak |
| `TestResult` | Einzelne Testfälle und Details, Startzeitpunkt, Testlauf-ID |
| `WorkflowExecutionResult` | Ausgabedaten, Trigger-Art, welche `JobStatus`-Werte für eine Ausführung gültig sind |
| `HumanGateState` | Kommentar, Identität des Freigebenden, Timeout, Payload von `submitApproval` |
| `ProductionCost` | Währung und Einheit von `apiCost` und `totalCost`, Kosten je Modell, ob `durationMs` Wall-Clock-Zeit ist |
| `ApiError` | Katalog der Server-Fehlercodes, Retry-Hinweis, Detail-Payload |

## Human Gate: Ablehnung undefiniert

- `JobStatus` kennt `awaiting_human` und `approved`, aber keinen Ablehnungszustand.
- `submitApproval(jobId)` kann daher nur freigeben. Ob eine Ablehnung zu `failed`, `blocked` oder zurück zu `generating` führt und welche Begründung mitgeschickt wird, ist offen.

## Währung und Einheit der Kosten

- `apiCost` und `totalCost` sind reine Zahlen. Währung (EUR oder USD), Einheit (Hauptwährung mit Nachkommastellen oder Cent) und Rundung sind nicht festgelegt.
- Der Mock liefert einheitenlose Dezimalwerte. `totalCost` enthält dort `apiCost` plus einen festen Plattformanteil; die echte Zusammensetzung ist offen.

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
