# Audit 03: CI-Härtung und Nachprüfung B3/B4 (PR #2)

- Datum: 26.09.2026, 11:25 (Europe/Berlin)
- Prüfer: Alpha-QA
- Gegenstand: PR #2, Branch `chore/build-scaffold`, HEAD `390d954` (davor `99b9b78`, Basis `8bb52ca`)
- Geänderte Dateien seit Audit 02: `.github/workflows/ci.yml` (neu), `vite.config.ts`, `tsconfig.json`, `src/styles/index.css`
- CI-Lauf: https://github.com/alpha-phoenix-labs/alpha-frontend-design/actions/runs/36232503949

## Ergebnis

**STATUS: FREIGEGEBEN.** Es gibt keinen blockierenden Befund. Drei Hinweise (H1 bis H3) sind unten beschrieben; keiner davon ist für den Merge nötig.

## 1. Workflow `.github/workflows/ci.yml`

| Anforderung von Chef | Zeile | Befund |
|---|---|---|
| Trigger `pull_request` gegen `main` und `push` auf `main` | 3–7 | erfüllt |
| `permissions: contents: read` | 9–10 | erfüllt, auf Workflow-Ebene |
| `concurrency` mit Abbruch veralteter Läufe | 12–14 | erfüllt; Gruppe nach PR-Nummer, bei `push` nach `github.ref` |
| Job `build` auf `ubuntu-latest` | 17–18 | erfüllt |
| `actions/checkout@v4` | 21 | erfüllt (siehe H1) |
| `actions/setup-node@v4`, `node-version-file: .nvmrc`, `cache: npm` | 24–27 | erfüllt |
| Mindestens Node 22.12 | 29–32 | erfüllt; der Schritt bricht mit Exit 1 ab, wenn Major < 22 oder Major = 22 und Minor < 12 |
| `npm ci`, `npm run typecheck`, `npm run build` | 34–41 | erfüllt, in dieser Reihenfolge |

Keine Secrets, keine Deploy-Schritte, keine Schreibrechte, keine Factory-Endpunkte im Workflow.

## 2. CI-Log unter Node 22 (Lauf 36232503949, Commit `390d954`, Ereignis `pull_request`)

- `Resolved .nvmrc as 22`, installiert wurde **Node v22.23.2** (Log 09:21:07 UTC, also 11:21 Europe/Berlin).
- Der Versionsprüfschritt gibt `v22.23.2` aus und ist bestanden.
- `npm ci`: `added 110 packages, and audited 111 packages`, `found 0 vulnerabilities`.
- Typecheck: erfolgreich.
- Build: `index.html` 0,39 kB, `index-BC6ukCpA.css` 4,41 kB (gzip 1,49), `index-D_8H1THN.js` 219,75 kB (gzip 68,66).
- Alle Schritte des Jobs `build` stehen auf `success`.

## 3. B3: Alias `@/*`

- `tsconfig.json` Zeile 21–23: `"@/*": ["./src/*"]`, das ist die einzige Definition.
- `vite.config.ts` Zeile 7–9: `resolve.tsconfigPaths: true`. Die Option ist in Vite 8.3.1 vorhanden (`node_modules/vite/dist/node/index.d.ts` Zeile 2724).
- Gegenprobe in einer sauberen Kopie:
  - Dev-Server mit `tsconfigPaths: true`: `@/App.tsx` in `src/main.tsx` Zeile 4 wird zu `/src/App.tsx` aufgelöst.
  - Dev-Server mit `tsconfigPaths: false`: `Failed to resolve import "@/App.tsx"`. Die Option ist also wirksam und für den Dev-Server nötig.
  - Produktions-Build mit `tsconfigPaths: false`: läuft trotzdem durch, mit identischen Hashes. Mit einem absichtlich falschen Ziel in `tsconfig.json` schlägt der Build dagegen fehl. Der Build liest die `paths` aus `tsconfig.json` also auch ohne die Option.

B3 ist behoben. Zur Einordnung siehe H2.

## 4. B4: Vite-Client-Typen

- `tsconfig.json` enthält kein `types`-Feld mehr.
- Die einzige Fundstelle von `vite/client` im Projekt (ohne `node_modules`) ist `src/vite-env.d.ts` Zeile 1.
- Typecheck läuft ohne Fehler.

B4 ist behoben.

## 5. Tailwind-Suchbereich (`src/styles/index.css` Zeile 1, Commit `390d954`)

- `@import "tailwindcss" source("../");` zeigt vom Ort der CSS-Datei aus auf `src/`.
- Gegenprobe: Eine Testdatei mit Klassennamen unter `audit/` ändert den CSS-Hash nicht (`index-BC6ukCpA.css` vorher und nachher). Dieselben Klassen in einer Datei unter `src/` erzeugen dagegen neues CSS (4,51 kB, neuer Hash).
- Das Wachstum durch Dateien außerhalb von `src/` ist damit behoben. Neue Audit-Berichte verändern den Build nicht mehr.

## 6. Typecheck, Build und Lockfile in sauberer Kopie

- Quelle: `git archive 390d954` nach `/tmp`, mit frischem `npm ci` (lokal Node 20.19.2, npm 9.2). Die Kopie ist danach gelöscht. Im Repo lief kein `npm ci --dry-run`.
- `npm ci`: Exit 0, 110 Pakete.
- `npm ls --all`: Exit 0, keine fehlenden oder ungültigen Pakete.
- `npm run typecheck`: Exit 0.
- `npm run build`: Exit 0, mit denselben Dateinamen und Größen wie in der CI (bitgleiche Hashes).
- Die Lockfile ist konsistent. Sie wird unter Node 20 (lokal) und Node 22.23.2 (CI) mit identischem Ergebnis installiert. B6 aus Audit 02 ist damit erledigt.

## Hinweise (nicht blockierend)

**H1 (Alpha-Deploy), `ci.yml` Zeile 21 und 24.** Das CI-Log endet mit der Warnung, dass `actions/checkout@v4` und `actions/setup-node@v4` für Node 20 gebaut sind und zwangsweise unter Node 24 laufen. Aktuell sind `actions/checkout` v7.0.1 und `actions/setup-node` v7.0.0. Die Korrektur ist, bei nächster Gelegenheit auf die aktuellen Hauptversionen anzuheben, nach Freigabe durch Chef, weil v4 ausdrücklich vorgegeben war. Danach muss die CI erneut grün laufen.

**H2 (Alpha-Deploy, nur Dokumentation).** Die Aussage aus der Meldung zu `99b9b78`, dass die Alias-Auflösung durch den Build nachweislich getestet ist, stimmt nicht ganz. Der Produktions-Build löst `@/*` auch ohne `resolve.tsconfigPaths` auf (Abschnitt 3). Wirksam ist die Option im Dev-Server, und den prüft die CI nicht. Die Konfiguration ist richtig und bleibt so. Es gibt nur keinen automatischen Test, der ein Entfernen der Option bemerken würde.

**H3 (Info).** Der Versionsprüfschritt (Zeile 32) wertet nur Major und Minor aus. Das genügt für die Grenze 22.12.0 und entspricht `engines.node >=22.12.0` in `package.json`.

## Offene Punkte aus früheren Audits

- B1 bis B6: erledigt.
- B7 (Info aus Audit 02, `zustand` 4.5.7 über `tunnel-rat` aus Drei): unverändert, kein Handlungsbedarf.

STATUS: FREIGEGEBEN
