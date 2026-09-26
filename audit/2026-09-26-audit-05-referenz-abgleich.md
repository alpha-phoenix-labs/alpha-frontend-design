# Audit 05: Abgleich main `f571db6` mit der Referenz (Punkt E)

- Datum: 2026-09-26
- Prüfer: Alpha-QA
- Stand: `main` `f571db6` (Squash von PR #3)
- Referenz: `/workspace/craftflow-refs/spatial-core-reference.html`
- Auftrag: Chef, Gesamtauftrag t19u, Punkt E. Lückenliste mit Zuständigkeit, keine neuen Wünsche.

## 1. Methode

1. `f571db6` in eine saubere Kopie entpackt, `npm run build`, `vite preview` auf Port 4179. Die Referenz lief unverändert über `python3 -m http.server` auf Port 4180 (CDN erreichbar).
2. Quelltext der Referenz vollständig gegen `src/components/ui/`, `src/components/canvas/`, `src/scenes/`, `src/styles/index.css`, `src/lib/motion.ts` und `src/mocks/` gelesen.
3. Browserlauf mit Playwright und Chrome (SwiftShader) für beide Seiten bei 375×812, 768×1024 und 1440×900. Zustände: Leerlauf, Intent „kosten“, danach Intent „3d“ bei offenem Modul, Ambient-Karte nach etwa 7 s. Gemessen wurden Positionen (`getBoundingClientRect`), Treffertest auf das Eingabefeld (`elementFromPoint`), Überlauf, Texte und Konsolenfehler. Screenshots liegen lokal unter `/tmp/qa-cmp` (nicht committet).

## 2. Lückenliste

| Nr. | Bereich | Lücke | Zuständig | Art |
| --- | --- | --- | --- | --- |
| L1 | Intent Node | Zurückgetretener Node ist hinter dem Modul verdeckt und per Maus nicht erreichbar | @Alpha-Surface | echte Lücke |
| L2 | Ambient Notifications | Uhrzeit statt „Just now“ | @Alpha-Surface | Entscheidung @Chef |
| L3 | Dynamische Module (Kosten) | Währungs- und Stundenformat weicht ab | @Alpha-Surface, Daten @Alpha-Core | Entscheidung @Chef |
| L4 | Neural Terrain / Animationen | `prefers-reduced-motion` wirkt nicht im Canvas (H3) | @Alpha-Spatial | echte Lücke, `424f1cf` in Arbeit |
| L5 | Intent Node | Mikrofon-Hover fehlt, weil der Knopf `disabled` ist | @Alpha-Surface | Hinweis, Entscheidung @Chef |

### L1: Zurückgetretener Intent Node ist verdeckt (echte Lücke)

- Referenz: Zeile 159, `#intent-node` behält `z-50` in jedem Zustand. Im Zustand „zurückgetreten“ (y −200, Opazität 0,3, Skalierung 0,95) liegt er sichtbar über der Modulkarte, und ein neuer Intent lässt sich jederzeit per Klick eingeben. Das neue Modul ersetzt dann das alte.
- main: `src/components/ui/IntentNode.tsx`, Zeile 37, setzt im Zustand `receded` `z-0`; `src/components/ui/ModuleStage.tsx`, Zeile 19, gibt der Karte `relative z-10`. Das war die Korrektur für B1 aus Audit 04 (X-Schaltfläche war verdeckt).
- Messung: `elementFromPoint` in der Mitte des Eingabefelds trifft bei offenem Modul in allen drei Breiten `SECTION.glass-panel` statt des Eingabefelds; in der Referenz trifft es das Eingabefeld. Optisch ist vom zurückgetretenen Node nur noch die Oberkante hinter der Karte zu sehen (Screenshots 1440 und 375). Per Tastatur (Fokus, Enter) funktioniert der Wechsel, das Ersetzen des Moduls selbst ist korrekt (`kosten`, dann `3d` ergibt genau ein 3D-Modul).
- Korrektur für @Alpha-Surface: Node und Modul so anordnen, dass sie sich nicht überdecken, statt den Node unter die Karte zu legen. Zum Beispiel die Modulbühne im Zustand `receded` um die Höhe des Nodes plus Abstand nach unten versetzen (Padding oben in `ModuleStage.tsx` oder ein kleinerer y-Versatz in `motion.ts`), dann darf der Node wieder `z-50` behalten. Abnahme: Treffertest trifft bei 375, 768 und 1440 px bei offenem Modul sowohl das Eingabefeld als auch das X und „Commit to Project“; der Node ist mit Opazität 0,3 sichtbar.

### L2: Zeitangabe der Ambient-Karte (Entscheidung)

- Referenz: Zeile 417, fester Text „Just now“.
- main: `src/components/ui/AmbientNotificationCard.tsx`, Zeilen 19–21 und 72, zeigt `HH:MM` aus `createdAt` (gemessen „14:29“).
- Korrektur, falls Referenztreue gewünscht: relative Zeit („Just now“ bis 60 s, danach Minuten) statt Uhrzeit. Sonst als bewusste Abweichung dokumentieren. @Chef entscheidet.

### L3: Währungs- und Stundenformat im Kostenmodul (Entscheidung)

- Referenz: Zeilen 301 und 311, „€ 4,250.00“, „€ 1,800“ und „Labor (Est. 12h)“.
- main: `src/components/ui/CostEstimateModule.tsx`, Zeilen 13–18 (`de-DE`), 58, 73 und 76; `src/mocks/costEstimate.ts`, Zeile 9. Angezeigt wird „4.250,00 €“, „1.800 €“ und „Labor“ mit abgesetztem „12 h“.
- Beträge und Summe stimmen überein. Die Abweichung ist nur die Lokalisierung. Falls Referenztreue gewünscht ist: `en-US`-Format mit vorangestelltem Symbol und das Label „Labor (Est. 12h)“ (Surface). Das Datenmodell braucht dafür keine Änderung. Sonst deutsche Lokalisierung als bewusste Abweichung festhalten. @Chef entscheidet.

### L4: Reduced Motion im Canvas (echte Lücke, bekannt als H3)

- main: `src/components/canvas/NeuralTerrainCanvas.tsx` und `src/scenes/NeuralTerrainScene.tsx` animieren Wellen und Parallax unabhängig von `prefers-reduced-motion`. Die UI-Schicht respektiert es bereits (`MotionConfig reducedMotion="user"`, Orb-Animation in `index.css`).
- Die Referenz berücksichtigt reduced-motion auch nicht. Die Lücke steht trotzdem hier, weil Chef den Commit `424f1cf` für den neuen Branch freigegeben hat.
- Korrektur: @Alpha-Spatial bringt `424f1cf` auf `feat/craftflow-completion`. Abnahme durch QA: mit `reducedMotion: 'reduce'` keine Positionsänderung der Punkte zwischen zwei Frames, Draw-Calls unverändert.

### L5: Mikrofon-Hover (Hinweis)

- Referenz: Zeilen 163–164, Knopf ohne Funktion, aber mit Hover (`hover:bg-white/10`, Icon wird weiß).
- main: `src/components/ui/IntentNode.tsx`, Zeilen 60–64, `disabled`, solange `onVoiceInput` fehlt. Deshalb ist der Hover abgeschaltet.
- Eine Sprachfunktion hat auch die Referenz nicht, es fehlt also nur die optische Rückmeldung. Aus Sicht der Barrierefreiheit ist `disabled` ehrlicher. @Chef entscheidet, ob der Hover zurückkommt (dann `disabled` entfernen und `aria-disabled` setzen).

## 3. Was übereinstimmt

- **Glas:** `.glass-panel`, `.glass-pill` und `.intent-orb` in `src/styles/index.css` sind wertgleich mit der Referenz.
- **Neural Terrain und Parallax** (`src/scenes/NeuralTerrainScene.tsx`): Ebene 40×40 mit 60 Segmenten, Punktgröße 0,03, Farbe `0x8899aa`, Opazität 0,4, additives Blending, Nebel 0,04, Kamera (0, 5, 15) mit FOV 60, Parallax-Faktor 0,001 × 2 mit Dämpfung 0,02, alle drei Wellenformeln.
- **Animationen** (`src/lib/motion.ts`): Der Node tritt auf y −200, Opazität 0,3 und Skalierung 0,95 in 0,8 s zurück. Module kommen in 0,8 s mit 0,1 s Verzögerung und gehen in 0,5 s nach y −15. Die Ambient-Karte kommt von x 40 in 0,8 s nach 6 s.
- **Dynamische Module:** Schlüsselwörter wie in der Referenz, plus „kostet“. Das Modul wird ersetzt statt gestapelt. Die Positionen des Kostenmoduls (420 × 460) und des 3D-Moduls (700 × 450, auf Tablet 672) sind bei 768 und 1440 px pixelgleich zur Referenz.
- **Glass Cards und Ambient:** Texte, Knöpfe, „Syncing to Project...“ und „Reviewing Draft...“ mit Fokus stimmen überein. Die Ambient-Karte sitzt bei 768 und 1440 px pixelgleich.
- **Header:** VRAM-Anzeige alle 3 s im Bereich 0,80 bis 1,00, Latenz, Schriften (Inter, JetBrains Mono lokal über `@fontsource`), Klänge lokal unter `public/sounds`.
- **Mobile:** main ist bei 375 px besser als die Referenz. Dort ragt die Ambient-Karte 57 px links aus dem Bild (x −57, Breite 384), in main liegt sie mit 343 px Breite im Viewport. Kein horizontaler oder vertikaler Überlauf in main, in keinem Zustand. Kopfzeile 67 statt 63 px hoch, weil die Statuszeile anders umbricht, ohne Funktionsfolge.
- **Konsole:** main ohne Fehler. Die Referenz hat 403 und 404 bei CDN-Ressourcen.

## 4. Urteil

main `f571db6` hat gegenüber der Referenz keinen neuen Blocker. Echte Lücken sind L1 (Surface) und L4 (Spatial, in Arbeit). L2, L3 und L5 sind Entscheidungen für @Chef. Nach der Umsetzung auf `feat/craftflow-completion` prüft QA L1 und L4 nach.

STATUS: FREIGEGEBEN (main als Basis). Die offenen Punkte L1 und L4 sind Aufträge für `feat/craftflow-completion`.
