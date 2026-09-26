# Audit 02 – Nachprüfung Build-Grundgerüst (Phase B)

- Datum: 26.09.2026, 10:58 (Europe/Berlin)
- Prüfer: Alpha-QA
- Repo: `/workspace/alpha-frontend-design`, Branch `main`, Stand uncommitted
- Umgebung: Node 20.19.2, npm 9.2, TypeScript 7.0.2
- Bezug: Befunde B1 und B2 aus Audit 01

## 1. Zustand des Arbeitsverzeichnisses beim Start der Prüfung

`node_modules/` im Repo war beim Start der Prüfung leer. Der erste Lauf von `npm run typecheck` endete mit Exit-Code 127 (`sh: 1: tsc: not found`), `npm run build` ebenso, und `npm ls` meldete alle 15 direkten Abhängigkeiten als `missing`.

Wahrscheinliche Ursache: `npm ci --dry-run` löscht unter npm 9 das vorhandene `node_modules/`, obwohl es nichts installiert. Alpha-Deploy hat diesen Befehl am Ende von Phase A ausgeführt. Mein eigener Dry-Run lief erst nach dem fehlgeschlagenen Typecheck.

Das betrifft nur den lokalen Arbeitsstand. `node_modules/` ist in `.gitignore` eingetragen und wird nicht committet.

## 2. Reproduzierbarkeit (sauberer Nachbau)

Um den zu committenden Stand unabhängig zu prüfen, habe ich `package.json`, `package-lock.json`, `.nvmrc`, `tsconfig.json`, `vite.config.ts`, `index.html` und `src/` in ein leeres Verzeichnis außerhalb des Repos kopiert (`/tmp/qa-verify`) und dort ausschließlich aus der Lockfile installiert.

| Schritt | Ergebnis |
|---|---|
| `npm ci` | Exit 0, 110 Pakete, 0 Schwachstellen |
| `npm run typecheck` | Exit 0, keine Meldungen |
| `npm run build` | Exit 0; `index.html` 0,39 kB (gzip 0,27), CSS 4,41 kB (gzip 1,49), JS 219,75 kB (gzip 68,66) – identisch mit der Meldung von Alpha-Deploy |

## 3. Konsistenz `package.json` und `package-lock.json`

- `lockfileVersion` 3.
- Wurzeleintrag der Lockfile: `dependencies`, `devDependencies` und `engines` sind identisch mit `package.json`.
- `npm ci` im sauberen Nachbau läuft ohne Abweichungsfehler durch. Damit ist die Lockfile synchron.

## 4. Abhängigkeiten und Peer-Kompatibilität

- `package.json` Z. 18–19 und 27–28: `react`, `react-dom`, `@types/react`, `@types/react-dom` stehen auf `~19.3.0`. **B1 aus Audit 01 ist behoben.**
- Aufgelöst: React 19.3.0, React DOM 19.3.0, Typen 19.3.0, Fiber 9.8.1.
- Peer-Anforderungen an React (`npm explain react`), alle erfüllt von 19.3.0:
  - `@react-three/fiber` 9.8.1: `>=19 <19.4`
  - `@react-three/drei` 10.7.9: `^19`
  - `react-dom` 19.3.0: `^19.3.0`
  - `framer-motion`, `its-fine`, `suspend-react`, `use-sync-external-store`, `react-use-measure`, `@use-gesture/react`: erfüllt
- `npm ls --all`: keine `invalid`, `extraneous` oder fehlenden Pflichtabhängigkeiten. Gemeldet werden nur `UNMET OPTIONAL DEPENDENCY`-Einträge (Plattform-Binaries anderer Betriebssysteme, optionale Vite- und Fiber-Peers wie `sass`, `expo`, `immer`). Das ist erwartetes Verhalten.

## 5. Node-Version

- `package.json` Z. 6–8: `"engines": { "node": ">=22.12.0" }`. `.nvmrc`: `22`. **B2 aus Audit 01 ist behoben.**
- `>=22.12.0` ist korrekt gewählt, weil Vite 8.3.1 und `@vitejs/plugin-react` 6.1.1 innerhalb der 22er-Reihe genau diese Mindestversion verlangen.

## Befunde

### B5 (mittel, lokal) – `node_modules/` im Repo ist leer
- Ort: `/workspace/alpha-frontend-design/node_modules/`
- Problem: Typecheck, Build und Dev-Server laufen im Repo selbst derzeit nicht. Der committete Stand ist davon nicht betroffen (siehe Abschnitt 2).
- Korrektur (zuständig: Alpha-Deploy): `npm ci` ohne `--dry-run` im Repo ausführen und danach `npm run typecheck` und `npm run build` bestätigen. Für künftige Konsistenzprüfungen unter npm 9 nicht `npm ci --dry-run` im Arbeitsverzeichnis verwenden, sondern einen sauberen Nachbau wie in Abschnitt 2 oder `npm install --package-lock-only --dry-run`.

### B6 (Hinweis) – Verifikation nur unter Node 20
- Alle Läufe fanden unter Node 20.19.2 statt, weil Node 22 auf dem gemeinsamen Rechner nicht installiert ist. npm meldet dazu `EBADENGINE`-Warnungen (eigenes `engines`-Feld und `camera-controls`). Ein Lauf unter Node 22 steht aus und sollte spätestens im ersten Cloudflare-Build bestätigt werden.

### B7 (Hinweis) – Zweite Zustand-Version im Baum
- `tunnel-rat` 0.1.2 (Unterabhängigkeit von Drei) bringt `zustand` 4.5.7 mit, parallel zu unserem `zustand` 5.0.15. Kein Konflikt, weil jede Version nur von ihrem eigenen Paket genutzt wird. Relevant erst für die Bundle-Größe, sobald Drei-Komponenten wie `View` importiert werden.

### Offen aus Audit 01
- B3 (Alias-Ziel `"/src/"` in `vite.config.ts` Z. 8) und B4 (doppelte Vite-Client-Typen) sind unverändert. Beide sind Hinweise und blockieren nicht.

## Urteil

B1 und B2 sind behoben. Der zu committende Stand ist aus der Lockfile reproduzierbar, Typecheck und Build laufen fehlerfrei, und alle Peer-Abhängigkeiten sind erfüllt. B5 betrifft nur das lokale, nicht versionierte `node_modules/` und muss vor weiterer Entwicklungsarbeit mit `npm ci` behoben werden. Für den Commit auf `chore/build-scaffold` blockiert B5 nicht.

**STATUS: FREIGEGEBEN**
