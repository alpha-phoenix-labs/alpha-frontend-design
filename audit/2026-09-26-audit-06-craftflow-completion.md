# Audit 06: `feat/craftflow-completion` (L1, L4, Punkt H, Build, Secrets)

- Datum: 2026-09-26
- Prüfer: Alpha-QA
- Geprüfter Stand: `97c7046` (L1, Alpha-Surface) auf `5dd34d4` (Punkt H, Alpha-Core) auf `201a7a0` (L4, Alpha-Spatial) auf `3fee54f` (wrangler.jsonc) auf `affcc07` (Audit 05) auf main `f571db6`
- PR: #4 gegen `main`
- Auftrag: Chef, Audit 06 nach Gesamtauftrag t19u

## 1. Methode

- Saubere Kopien der Stände `5dd34d4` und `97c7046` per `git archive`, `node_modules` verlinkt (Lockfile unverändert gegenüber main).
- Node 22.12.0 (`/home/box/.nvm/versions/node/v22.12.0`): `tsc --noEmit`, `npm run build`.
- Browser: Playwright mit Chrome (SwiftShader) gegen `vite preview` von `97c7046`. Treffertest per `elementFromPoint` auf die Mitte von Eingabefeld, X und „Commit to Project“ bei offenem Modul, danach echter Mausklick ins Eingabefeld und Wechsel des Intents. Viewports 375×812, 768×1024, 1440×900 (Abnahmevorgabe) sowie zusätzlich 375×667 und 1366×768.
- L4: Zwei Bildausschnitte der Canvas im Abstand von 3 s mit Mausbewegung, einmal mit `reducedMotion: 'reduce'`, einmal ohne.
- Punkt H: Simulation des `MockFactoryService` in allen drei Szenarien über 20 Minuten in Schritten von 500 ms mit injizierter Uhr, Freigabe am Human Gate nach 10 s Wartezeit. Invarianten nach jedem Schritt geprüft.
- Secrets: Suche in `dist` nach Schlüsseln, Tokens, Endpunkten, Source-Maps und `VITE_`-Variablen, Liste aller URLs.

## 2. Ergebnisse

### 2.1 L1 behoben (`97c7046`, Alpha-Surface)

Änderung: `src/components/ui/IntentNode.tsx`, Zeile 37, `z-50` in jedem Zustand; `src/components/ui/ModuleStage.tsx`, Zeile 14, `pt-48`.

| Viewport | Modul | Eingabefeld | X | Commit | Node-Unterkante | Karte oben / unten | Überlauf x / y | Wechsel per Klick |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 375×812 | Kosten | ok | ok | ok | 291 | 334 / 777 | 0 / 0 | ok |
| 375×812 | 3D | ok | ok | – | 291 | 331 / 781 | 0 / 0 | ok |
| 768×1024 | Kosten | ok | ok | ok | 390 | 423 / 883 | 0 / 0 | ok |
| 768×1024 | 3D | ok | ok | – | 390 | 428 / 878 | 0 / 0 | ok |
| 1440×900 | Kosten | ok | ok | ok | 328 | 361 / 821 | 0 / 0 | ok |
| 1440×900 | 3D | ok | ok | – | 328 | 366 / 816 | 0 / 0 | ok |

Der Node ist mit Opazität 0,3 sichtbar, Node und Karte überdecken sich nicht, keine Konsolenfehler. Abnahmekriterium aus Audit 05 und Chef-Vorgabe erfüllt.

### 2.2 L4 behoben (`201a7a0`, Alpha-Spatial)

- `src/components/canvas/NeuralTerrainCanvas.tsx`, Zeilen 7–31: `prefers-reduced-motion` live über `useSyncExternalStore`, `frameloop="demand"` bei gesetzter Einstellung.
- `src/scenes/NeuralTerrainScene.tsx`, Zeilen 78–110: fester Frame bei t = 0, Kamera auf Grundposition, kein Pointer-Listener, `useFrame` kehrt früh zurück. Disposal unverändert (ab Zeile 71).
- Browser: Mit `reduce` sind beide Ausschnitte byte-identisch, ohne die Einstellung unterscheiden sie sich. Deckt sich mit Spatials Messung (1 Draw-Call beim Laden, danach 0).

### 2.3 Punkt H geprüft (`5dd34d4`, Alpha-Core)

- Neuer Typ `WorkflowProductionMetrics` in `src/types/factory/productionMetrics.ts`, vollständig `readonly`, Geld als ganzzahlige USD-Micros. `JobStatus` unverändert.
- Vertrag: `FactoryService.getProductionMetrics` (Zeile 25) ist die einzige Schnittstelle; `FactoryServiceMode` ist nur `'mock'` (`src/services/factory/index.ts`, Zeile 10), Mock und späteres Live nutzen damit denselben Vertrag. Keine Endpunkte, kein HTTP-Client. Keine Altreferenzen auf `ProductionCost`, `getProductionCost` oder `productionCosts` in `src/` und `docs/`.
- Gesamtkosten entstehen nur in `totalProductionCostMicros()` (`src/services/factory/productionMetrics.ts`), der Mock nutzt sie (`MockFactoryService.ts`, Zeile 234).
- Store: `refreshJob` ersetzt den Eintrag nur bei geänderten Werten (`shallow`), gut für Re-Renders.
- Simulation, 0 Verletzungen in allen Szenarien: Gesamt gleich API plus Plattform; alle Zähler ganzzahlig, nicht negativ und nie fallend; PASS plus FAIL höchstens Anzahl Tests; `TestResult` und Metriken stimmen überein; Produktionszeit steht während der Wartezeit am Gate.
- Endstände: happyPath `completed`, 6 PASS, 0 FAIL, 1 Retry, 1 Repair, 78.000 Micros; testFailure `failed`, 4 PASS, 2 FAIL, 1 Retry, 3 Repair, 113.500 Micros; blocked ohne Tests, 50.500 Micros. Identisch mit Cores Meldung.

### 2.4 Build und Typecheck (Node 22.12.0)

`tsc --noEmit` Exit 0, `npm run build` Exit 0 ohne Warnung. Einstieg `index` 379,32 kB (gzip 120,30 kB), `three-core` 377,37 kB, `three` 365,01 kB, `NeuralTerrainCanvas` 175,23 kB, alle lazy außer dem Einstieg.

### 2.5 Secrets in `dist`

Keine Schlüssel, Tokens, Passwörter, Source-Maps oder `VITE_`-Variablen. Externe URLs nur Bibliotheks- und Namensraum-Links (w3.org, react.dev, pmnd.rs, github.com/pmndrs). Kein n8n-, Render-, Google-, Drive- oder Workers-Endpunkt. „webhook“ erscheint nur als Quelltyp der Ambient-Karte (`src/types/ambient.ts`, Zeile 4).

## 3. Bewusste Abweichungen von der Referenz (Entscheidung Chef, erledigt)

- L2: Ambient-Karte zeigt die Uhrzeit statt „Just now“.
- L3: Deutsche Euro-Formatierung im Kostenmodul.
- L5: Mikrofon-Knopf bleibt `disabled` ohne Hover, da auch in der Referenz ohne Funktion.

Diese Punkte sind keine offenen Lücken mehr.

## 4. Hinweise (nicht blockierend)

- **H6, @Alpha-Surface:** Durch `pt-48` scrollt die Seite bei niedrigen Viewports mit offenem Modul vertikal: 375×667 um 124 px (Kosten) bzw. 130 px (3D), 1366×768 um 69 px bzw. 60 px. Bei 375×667 liegt „Commit to Project“ zunächst unterhalb des sichtbaren Bereichs (Mitte bei y 716), ist per Scrollen erreichbar. Die Abnahme-Viewports sind nicht betroffen. Optional: den Abstand an die Höhe koppeln, z. B. `pt-40` plus kleinere Werte über eine `max-height`-Variante, sodass Node und Karte bei 667 px Höhe ohne Scrollen passen.
- **H7, @Chef / Projektleitung:** Das Repo ist per Git-Integration an Cloudflare Workers Builds angebunden (Check `Workers Builds: alpha-frontend-design`, App `cloudflare-workers-and-pages`, Umgebung `production`). Der Check scheitert auf jedem Commit sofort, auch auf main. Er ist nicht Required. Wird er grün, kann ein Merge auf main automatisch produktiv deployen. Kontoinhaber und Auto-Deploy-Wunsch müssen vor dem Merge von der Projektleitung geklärt werden. Steht in der PR-Beschreibung.
- H2 (Warnung `THREE.Clock` aus R3F), H4 (Mute, Factory-Store und Polling nicht in `App.tsx`) und H5 (Autoplay-Sperre des Chimes) bestehen unverändert.

## 5. Urteil

Keine Blocker. L1, L4 und Punkt H sind umgesetzt und nachgeprüft, Build und Typecheck unter Node 22.12 sind sauber, `dist` ist frei von Secrets.

Bedingung: Das Urteil gilt für `97c7046`. Liegt dieser Commit unverändert als Head von `feat/craftflow-completion` auf origin und ist der Required Check `build` darauf grün, ist PR #4 aus QA-Sicht merge-fertig. Der Merge selbst bleibt beim Human Gate, H7 ist vorher zu klären.

STATUS: FREIGEGEBEN

---

## Nachtrag: Prüfung auf Head `a1111be` (26.09.2026, 14:55 Uhr MESZ)

Geprüft in einer sauberen Kopie von origin, nicht im gemeinsamen Checkout.

### Identität zu `97c7046`
`git diff 97c7046 a1111be -- src index.html vite.config.ts tsconfig.json` ist leer. Alle Ergebnisse zu L1 (375, 768 und 1440 px), L4, Punkt H und Factory-Vertrag gelten deshalb unverändert für `a1111be`. Neu gegenüber `5dd34d4` sind nur `.github/workflows/cloudflare-deploy-test.yml`, `wrangler` 4.141.0 als devDependency und der Lockfile.

### Build
`npm ci`, `npm run typecheck` und `npm run build` laufen unter Node 22.12.0 fehlerfrei. Der CI-Check `build` auf `a1111be` ist grün. In `dist` gibt es keine Secrets, Tokens oder Endpunkte (die Treffer der Suche sind nur `mask-type` und `transmissionRenderTarget` aus React und Three.js).

### Runtime, Re-Renders, Disposal und Speicher
- In 6 s Leerlauf gibt es 3 React-Commits, alle nur in Kopfzeile und Ambient-Leiste (Uhr- und VRAM-Tick). In 3 s Mausbewegung gibt es 1 Commit, der ebenfalls nur der Tick ist. Die Parallaxe löst also keine React-Renders aus.
- Nach 20 Zyklen Modul öffnen und schließen, jeweils nach GC: Der Heap steigt von 5,84 auf 6,50 MB, die DOM-Knoten von 113 auf 133, die Listener bleiben bei 184, und es existiert weiterhin genau 1 Canvas. Es gibt kein wachsendes Leck.
- In der Konsole steht nur die bekannte Warnung `THREE.Clock ... deprecated` (H2, aus R3F, nicht blockierend).

### Befund B1 (blockierend): Cloudflare-Workflow deployt produktiv bei jedem PR-Push
`.github/workflows/cloudflare-deploy-test.yml`, Zeile 5 bis 7 und Zeile 39 bis 44: Der Schritt „Deploy to Cloudflare“ ruft `command: deploy` ohne Bedingung auf, auch bei `pull_request`. Sobald der Deploy-Schritt erfolgreich läuft, geht jeder Push auf PR #4 ungemergt produktiv auf den Worker `alpha-frontend-design`. Damit ist das einzige Human Gate (Merge auf main) umgangen. Das widerspricht der Projekt-Governance und Chefs eigener Vorgabe (1).

Bisher ist nichts live gegangen, weil alle drei Läufe (`36242949988`, `36242990503`, `36243154863`) im Deploy-Schritt gescheitert sind.

Korrektur für @Alpha-Deploy, nach Bestätigung durch die Projektleitung:
- Den Stand aus `a894943` wiederherstellen: Bei `pull_request` und bei jedem anderen manuellen Start läuft `command: versions upload`.
- `command: deploy` läuft nur in einem eigenen Schritt mit `if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main' && inputs.deploy == true` und einer booleschen Eingabe `deploy` mit `default: false`.
- `wranglerVersion: 4.141.0` in der Action setzen.
- Den Auth-Fehler (siehe unten) erst danach beheben.

Gut umgesetzt sind: Es wird `pull_request` genutzt, nicht `pull_request_target`, also bekommen PRs aus Forks keine Secrets. `permissions: contents: read` ist gesetzt. Secrets werden nur über `${{ secrets.* }}` in `with:` übergeben. Es gibt kein `echo`, kein `set -x`, keine Datei, und der Log maskiert die Account-ID als `***`. Die Tags `actions/checkout@v6`, `actions/setup-node@v4` und `cloudflare/wrangler-action@v4` existieren.

### Separater Punkt, nicht Teil des Urteils: Ursache des Deploy-Fehlers
Die erste Fehlerzeile in Lauf `36243154863` lautet: `A request to the Cloudflare API (/accounts/***/workers/services/alpha-frontend-design) failed. Authentication error [code: 10000]`. Das fällt in die Kategorie Auth/Token. Der Token hat für diesen Account keine Workers-Berechtigung, oder er gehört nicht zu dieser Account-ID. Das muss die Projektleitung beim Token klären; im Code gibt es dafür nichts zu tun.

### Externer Blocker außerhalb des Codes
Der Check „Workers Builds: alpha-frontend-design“ der Cloudflare-GitHub-App schlägt auf jedem Commit fehl. Er wird nur dokumentiert, und niemand ändert etwas, um ihn zu erraten. Er blockiert das Urteil nicht.

### Bewusste Abweichungen
L2, L3 und L5 sind laut Chef bewusst so entschieden und nur vermerkt.

### Urteil auf `a1111be`
STATUS: BLOCKIERT, einzig wegen B1. Alle anderen Prüfpunkte sind bestanden. Nach der Workflow-Korrektur prüfe ich nur noch den neuen Workflow-Diff und den CI-Lauf nach und gebe dann frei.
