# Audit 04: CRAFTFLOW Spatial-Core-UI (Gesamtaudit)

- Datum: 26.09.2026
- Prüfer: Alpha-QA
- Branch: `feat/craftflow-ephemeral-interface`, PR #3 gegen `main`
- Geprüfter Stand: `1c6d4e6` (Gesamtaudit), Nachprüfung auf `1e1194e` (nach Rebase auf `main` `4160645`)
- Referenz: `spatial-core-reference.html` (primär), `craftflow-ui-plan.md`
- Urteil auf `1c6d4e6`: STATUS: BLOCKIERT (B1, B2)
- Endgültiges Urteil auf `1e1194e`: **STATUS: FREIGEGEBEN** (B1 und B2 behoben, siehe Abschnitt 5)

## 1. Methode

1. Saubere Kopie per `git archive` von `1c6d4e6` erstellt, Lockfile identisch mit dem Arbeitsbaum, `node_modules` verlinkt.
2. `npx tsc --noEmit` und `npx vite build` ausgeführt.
3. `vite preview` gestartet und mit headless Chrome (ANGLE/SwiftShader) bei 375 × 812, 768 × 1024 und 1440 × 900 px die Referenzabläufe durchgespielt: Leerlauf, „Was kostet das?“, „Commit to Project“, „3d raum“, Modul schließen, Ambient-Karte nach 6 s, „Review Draft“, eine Eingabe ohne Treffer, dazu ein Lauf mit `prefers-reduced-motion: reduce`.
4. Die Klickbarkeit habe ich per `document.elementFromPoint` in der Mitte jeder Schaltfläche geprüft, also so, wie ein echter Klick trifft.
5. Statische Prüfung von Disposal, Timern, Re-Render-Pfaden, Factory-Grenzen und Sicherheit, dazu eine Suche im gebauten Bundle.

## 2. Blockierende Befunde

### B1: Der zurückgetretene Intent-Node verdeckt die Schließen-Schaltfläche der Module

- Datei: `src/components/ui/IntentNode.tsx`, Zeile 37 (`pointer-events-auto absolute z-50`), zusammen mit `src/components/ui/ModuleStage.tsx`, Zeilen 14–19 (Modulebene ohne eigenen Stapelrang).
- Zuständig: @Alpha-Surface
- Beobachtung: Im Zustand `receded` sitzt der Node mit `translateY(-200px) scale(0.95)` genau über der Kopfzeile des geöffneten Moduls und liegt mit `z-50` darüber. Klicks auf das X landen deshalb im Intent-Node.

| Breite | X am Kostenmodul | X am 3D-Modul | Commit |
|---|---|---|---|
| 375 px | verdeckt (trifft „Spracheingabe“) | verdeckt (trifft „Spracheingabe“) | ok |
| 768 px | verdeckt (trifft „Intent eingeben“) | ok | ok |
| 1440 px | verdeckt (trifft „Intent eingeben“, Node bei y 261–328, X bei y 298) | ok | ok |

  Das Kostenmodul lässt sich damit bei keiner Breite per Maus oder Touch über das X schließen. Bei 375 px gilt das auch für das 3D-Modul. Außerdem liegt der halbtransparente Platzhaltertext des Nodes sichtbar über der Modulkopfzeile (Screenshots `*-02-kosten.png` und `*-04-3d.png`). Die Referenz hat dieselbe Geometrie, ist aber nur auf feste Desktopbreiten ausgelegt. Eine Schaltfläche, die man nicht anklicken kann, ist trotzdem ein Fehler.
- Korrektur: Die Modulebene muss über dem zurückgetretenen Node liegen. Empfohlen: In `IntentNode.tsx` Zeile 37 `z-50` nur im Zustand `idle` setzen und im Zustand `receded` einen Rang unter der Modulebene verwenden, etwa per `className` abhängig von `posture`. Die Modulkarte in `ModuleStage.tsx` Zeile 19 bekommt dazu `relative z-10` oder einen gleichwertigen Rang. So verschwindet der Node im Zustand `receded` hinter dem Glas, bleibt aber außerhalb der Karte bedienbar wie in der Referenz. Alternativ kann der Node im Zustand `receded` `pointer-events-none` bekommen. Das weicht aber vom Referenzverhalten ab.
- Abnahmekriterium: `elementFromPoint` in der Mitte des X trifft die Schaltfläche bei 375, 768 und 1440 px, und zwar für beide Module. Der Platzhaltertext des Nodes überlagert die Modulkopfzeile nicht mehr.

### B2: `prefers-reduced-motion` wird von den Framer-Motion-Animationen ignoriert

- Datei: `src/App.tsx`, Zeilen 57–72. Es gibt kein `MotionConfig`, und `git grep MotionConfig` findet im ganzen Repository nichts.
- Zuständig: @Chef (Assemblierung von `App.tsx`)
- Beobachtung: Mit `reducedMotion: 'reduce'` laufen die Bewegungen von Intent-Node, Modulkarten und Ambient-Karte vollständig weiter. Berücksichtigt werden nur die CSS-Animation des Orbs (`src/styles/index.css`, Zeilen 92–95) und die Verzögerung in `useIntentRouter.ts` Zeile 91. Seit Zwischenbefund 2 ist das als Pflichtpunkt fürs Gesamtaudit angekündigt.
- Korrektur: Den Inhalt von `App` in `<MotionConfig reducedMotion="user">` aus `framer-motion` einschließen. Weiterer Code ist nicht nötig, weil Framer dann Transformationen abschaltet und nur die Deckkraft überblendet.
- Abnahmekriterium: Im Lauf mit `reducedMotion: 'reduce'` gibt es keine `translate`- oder `scale`-Übergänge an Intent-Node, Modul und Ambient-Karte.

## 3. Ergebnisse ohne Befund

### 3.1 Typen und Build

- `tsc --noEmit` endet mit Exit 0, `vite build` mit Exit 0 und ohne Warnung.
- Die Chunks: `index` 377,40 kB (gzip 119,99 kB), `three-core` 377,37 kB, `three` 365,01 kB und `NeuralTerrainCanvas` 174,69 kB.
- `dist/index.html` lädt nur `index-*.js` und die CSS-Datei. Für die Three.js-Chunks gibt es keinen `modulepreload`, und der Einstiegs-Chunk erreicht sie nur über den dynamischen Import.
- Der Split in `vite.config.ts` entlang von `three/build/three.core.js` ist begründet und kommentiert. Ein `chunkSizeWarningLimit` wird nicht gebraucht.
- Im Code gibt es kein TODO, kein `console`, kein `as any` und kein `@ts-`.

### 3.2 Funktion gegen die Referenz

Alle drei Breiten verhalten sich gleich:

- Der Input hat beim Laden den Fokus.
- „Was kostet das?“ öffnet das Kostenmodul mit 4.250,00 €, 1.800 €, 1.020 € und 1.430 €.
- „Commit to Project“ ist klickbar und schreibt `Syncing to Project...`.
- „3d raum“ öffnet das 3D-Modul.
- Die Ambient-Karte erscheint nach 6 s und liegt vollständig im Viewport.
- „Review Draft“ schreibt `Reviewing Draft...` und setzt den Fokus.
- „hallo“ öffnet nichts und bleibt im Feld stehen.
- Es gibt keinen horizontalen Überlauf, weder im Leerlauf noch mit geöffnetem Modul (`scrollWidth - innerWidth` ist 0).

### 3.3 Responsive Darstellung und UI-Konsistenz

- Bei 375 px bricht die Metrikzeile im Header auf zwei Zeilen um. Das ist lesbar und in Ordnung.
- Die Module passen sich der Breite an, und Glas, Radien und Typografie entsprechen der Referenz.
- Bei 375 px überdeckt die Ambient-Karte den unteren Teil des 3D-Moduls. Bedienelemente werden dabei nicht verdeckt. Das ist eine Folge der festen Position aus der Referenz und kein Befund.

### 3.4 Disposal, Speicher und Timer

- In `src/scenes/NeuralTerrainScene.tsx` werden in den Zeilen 49–50 `geometry.dispose()` und `material.dispose()` aufgerufen, und Zeile 60 entfernt den `pointermove`-Listener. Seit ZB 1 hat sich an Canvas und Szene nichts geändert.
- Alle Hook-Timer werden aufgeräumt. Das ist in ZB 4 belegt: `useAmbientSimulation` Zeile 61, `useSystemMetrics` Zeile 34, `useFactoryJobPolling` Zeile 19 und `useIntentRouter` Zeile 74.
- Der Timer in `MockFactoryService` (Zeile 203) läuft einmal ab und hält danach nichts fest.

### 3.5 Re-Render

- Die Wurzel `App` ruft nur `useMetricsSampling()` auf, ohne Werte zu abonnieren, und rendert deshalb nicht neu.
- `HeaderSlot` rendert alle 3 s neu. `Workspace` rendert pro Tastendruck neu, und durch `renderModule` inline (Zeilen 36–46) rendert das offene Modul dann mit. Das ist gering, weil der Node beim offenen Modul zurücktritt.
- Der Canvas ist ein eigenes Geschwister unter `Suspense` und wird von den Store-Änderungen nicht berührt.
- Bildrate im headless Chrome mit Software-Rendering: 60, 61 und 59 fps. Auf echter Mobil-GPU ist das nicht gemessen, siehe H3.

### 3.6 Factory-Grenzen

- `VITE_FACTORY_API_BASE_URL` wird nur in `src/services/factory/index.ts` Zeile 26 gelesen, und die URL wird nicht nach außen gegeben.
- Es gibt keinen HTTP-Client, kein `fetch` und keine Endpunkt-Strings.
- `@/mocks` wird nur aus `src/services/` importiert.
- `src/components/` importiert nichts aus Store, Services, Hooks oder Mocks.
- Store, Services und Mocks sind frei von React-Renderern, Three und Framer.
- Die offene Ablehnung am Human Gate ist in `docs/factory-contract-open.md` (Zeilen 28–31) dokumentiert.

### 3.7 Sicherheit

- Es gibt kein `dangerouslySetInnerHTML`, kein `innerHTML`, kein `eval` bzw. `new Function`, kein `target="_blank"` und keinen `localStorage`-Zugriff.
- Im Bundle stehen keine Schlüssel und keine Factory-, n8n-, Render-, Gemini- oder Drive-Adressen. Gefunden habe ich nur Bibliotheks-URLs von React und R3F sowie SVG-Namespaces.
- `.env.example` ist leer.

## 4. Hinweise (nicht blockierend)

- H1, @Alpha-Deploy: `index.html` hat kein `<link rel="icon">`. Chrome fragt deshalb `/favicon.ico` ab und bekommt 404, das ist der einzige Konsolenfehler. Zu beheben mit einem Favicon unter `public/` oder `<link rel="icon" href="data:,">`.
- H2, Abhängigkeit: Die Konsole warnt `THREE.Clock: This module has been deprecated`. Die Warnung kommt aus React Three Fiber, nicht aus Projektcode (`git grep Clock` findet in `src/` nichts). Beobachten, bis R3F nachzieht.
- H3, @Alpha-Spatial: Der Canvas bewegt sich auch bei `prefers-reduced-motion` weiter. Empfehlung: Die Wellenamplitude reduzieren oder `frameloop="demand"`, wenn `prefersReducedMotion()` gilt. Die 60 fps auf einer echten Mobil-GPU mit `dpr` bis 2 (`NeuralTerrainCanvas.tsx` Zeile 12) sind nicht gemessen.
- H4, @Chef: Mute-Zustand, Factory-Store und `useFactoryJobPolling` sind vorbereitet, in `App.tsx` aber noch nicht angeschlossen. Ich werte das als Vertragsschicht, nicht als Provisorium.
- H5: Die Autoplay-Sperre der Browser blockiert den Chime, wenn vorher keine Nutzeraktion stattfand. `useUiSound.ts` Zeile 47 fängt das still ab, so wie die Referenz auch.

## 5. Nachprüfung

Geprüft auf `1e1194e`, dem HEAD von PR #3 nach dem Rebase auf `main` (`4160645`). Eine Vorprüfung auf `8b8cac2` kam zum gleichen Ergebnis.

### 5.1 Stand und CI

- `main` ist Vorfahr von `1e1194e`, PR #3 hat 29 Commits und ist `MERGEABLE` und `CLEAN`. Der Pflicht-Check `build` ist grün (Run 36234401838).
- `git diff 8b8cac2 1e1194e` zeigt nur `audit/2026-09-26-audit-03-ci-hardening.md`, der Bericht kommt aus `main`. Der Produktcode ist also derselbe, den ich auf `8b8cac2` vorgeprüft habe.
- Spatials lokaler Commit `424f1cf` ist nicht im Branch.
- Saubere Kopie per `git archive`, Lockfile identisch: `npx tsc --noEmit` endet mit Exit 0, `npx vite build` endet ohne Warnung, `dist/favicon.svg` ist vorhanden.

### 5.2 B1 behoben (`8b8cac2`, Alpha-Surface)

Der Node bekommt nur im Zustand `idle` `z-50` und im Zustand `receded` `z-0`. Die Modulkarte in `ModuleStage.tsx` hat `relative z-10`. Der Treffertest per `elementFromPoint` trifft bei 375, 768 und 1440 px jedes Mal das Ziel, also das X am Kostenmodul, das X am 3D-Modul und „Commit to Project“. Horizontalen Überlauf gibt es nicht (`overflowX` 0, auch mit offenem Modul). „Commit to Project“ zeigt `Syncing to Project...`, „Review Draft“ zeigt `Reviewing Draft...` und setzt den Fokus, die Ambient-Karte liegt im Viewport, und „hallo“ öffnet nichts.

### 5.3 B2 behoben (`b9d3e4b`, Chef)

`App.tsx` liegt in `<MotionConfig reducedMotion="user">`. Gemessen habe ich 80 ms nach dem Absenden:
- Mit `no-preference` läuft der Node noch (`scale` 0,99, `translateY` -30), die Karte auch (`scale` 0,98, `translateY` 30).
- Mit `reduce` steht der Node sofort an seiner Endposition (`scale` 0,95, `translateY` -200), die Karte hat `transform: none`, und nur die Deckkraft wird überblendet.

### 5.4 Hinweise nach der Nachprüfung

- H1 erledigt (`1655499`): `public/favicon.svg` ist in `index.html` eingebunden und liefert 200. Der 404 ist weg.
- H2 offen: Die einzige Konsolenmeldung ist weiterhin die Warnung zu `THREE.Clock` aus R3F.
- H3 offen, von Chef zurückgezogen: Eine Umsetzung liegt als `424f1cf` auf dem lokalen Branch `fix/spatial-reduced-motion` und ist nicht Teil von PR #3. Spatial hat dazu mit headless Chrome (Software-Rendering) bei 1440 px gemessen: normal 122 Draw-Calls in 2 s (etwa 61 fps), mit `reduce` 1 Draw-Call beim Laden und danach 0. Eine Messung auf echter Mobil-GPU steht weiter aus.
- H4 und H5 offen, unverändert.

### 5.5 Urteil

**STATUS: FREIGEGEBEN** für PR #3 auf `1e1194e`. Offen sind nur die nicht blockierenden Hinweise H2 bis H5. Der Merge auf `main` bleibt das Human Gate und braucht die Freigabe der Projektleitung.
