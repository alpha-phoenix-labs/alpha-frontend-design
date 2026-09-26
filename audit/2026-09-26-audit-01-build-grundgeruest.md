# Audit 01 – Build-Grundgerüst

- Datum: 26.09.2026, 10:50 (Europe/Berlin)
- Prüfer: Alpha-QA
- Repo: `/workspace/alpha-frontend-design`, Branch `main`, Stand uncommitted
- Geprüfte Dateien: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `src/styles/index.css`
- Umgebung: Node 20.19.2, TypeScript 7.0.2

## Ergebnis Typecheck

`npm run typecheck` (`tsc --noEmit`) endet mit Exit-Code 0 und ohne Meldungen.

## Geprüfte Punkte

| Bereich | Ergebnis |
|---|---|
| Strenge Optionen (`tsconfig.json` Z. 16–20) | Alle geforderten Optionen aktiv: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`. Zusätzlich `noFallthroughCasesInSwitch`. |
| Alias `@/*` | `tsconfig.json` Z. 22–24 und `vite.config.ts` Z. 8 stimmen überein. `src/main.tsx` Z. 4 nutzt den Alias, Typecheck und Build lösen ihn auf. |
| Tailwind 4 | Eingebunden über `@tailwindcss/vite` (`vite.config.ts` Z. 3 und 6). Kein `tailwind.config.ts`, kein `postcss.config.js`. `src/styles/index.css` Z. 1 `@import "tailwindcss";`, Z. 3–15 gültiger `@theme`-Block mit 8 Tokens in korrekten v4-Namensräumen (`--blur-*`, `--color-*`, `--radius-*`, `--shadow-*`). |
| Redundante Pakete | Keine. `npm ls` ohne invalid, extraneous oder missing. Genau die 7 Laufzeit- und 8 Dev-Abhängigkeiten aus dem Auftrag. |
| Platzhalter | Keine TODO-, FIXME- oder Platzhaltertexte gefunden. `src/App.tsx` ist eine vollständige, bewusst leere Shell. |
| `index.html` | Gültiger Vite-Einstieg, `lang="de"`, Viewport-Meta vorhanden, Skript verweist auf `/src/main.tsx`. |
| `src/main.tsx` | Null-Prüfung für `#root` vorhanden (Z. 8–10), `StrictMode` aktiv, CSS-Import vorhanden. |
| Node-Kompatibilität | `vite` 8.3.1 und `@vitejs/plugin-react` 6.1.1 verlangen Node `^20.19.0 \|\| >=22.12.0`. Node 20.19.2 erfüllt das. |

## Befunde

### B1 (mittel) – Versionsbereich von React erlaubt eine inkompatible Version
- Datei: `package.json` Z. 16–17 (`"react": "^19.3.0"`, `"react-dom": "^19.3.0"`), ebenso Z. 23–24 für die Typpakete.
- Problem: `@react-three/fiber` 9.8.1 verlangt `react >=19 <19.4`. Der Bereich `^19.3.0` erlaubt aber auch 19.4 und höher. Die `package-lock.json` hält aktuell 19.3.0 fest. Eine Installation ohne Lockfile oder ein `npm update` würde den Peer-Konflikt aber erzeugen.
- Korrektur (zuständig: Alpha-Deploy): Bereich auf `~19.3.0` einengen für `react`, `react-dom`, `@types/react` und `@types/react-dom`. In CI und auf Cloudflare Pages `npm ci` statt `npm install` verwenden.

### B2 (niedrig) – Node-Version nicht im Projekt festgelegt
- Datei: `package.json` (kein `engines`-Feld), keine `.nvmrc`.
- Problem: `camera-controls` 3.1.2 (Unterabhängigkeit von Drei) verlangt Node `>=22.0.0` und npm `>=10.5.1`. Lokal laufen Node 20.19.2 und npm 9.2. Das betrifft den aktuellen Build nicht, ist aber für Cloudflare Pages und für eine spätere Nutzung von `CameraControls` relevant (bereits als offener Punkt bei Chef).
- Korrektur (zuständig: Alpha-Deploy, nach Entscheidung von Chef): `"engines": { "node": ">=22.12.0" }` ergänzen oder Node 22 in der Cloudflare-Build-Umgebung festlegen.

### B3 (Hinweis) – Alias-Ziel in `vite.config.ts` hängt vom Projekt-Root ab
- Datei: `vite.config.ts` Z. 8 (`replacement: "/src/"`).
- Problem: Funktioniert, weil Vite `/src/` relativ zum Projekt-Root auflöst. Wird `root` später geändert oder die Konfiguration aus einem anderen Verzeichnis geladen, bricht der Alias.
- Empfehlung (zuständig: Alpha-Deploy, optional): absoluten Pfad verwenden, zum Beispiel `fileURLToPath(new URL("./src/", import.meta.url))`.

### B4 (Hinweis) – Doppelte Einbindung der Vite-Client-Typen
- Dateien: `tsconfig.json` Z. 8 (`"types": ["vite/client"]`) und `src/vite-env.d.ts` Z. 1.
- Problem: Harmlos, aber doppelt. Kein Handlungsbedarf, wenn beide bewusst bleiben sollen.

## Urteil

Keine blockierenden Befunde. Typecheck fehlerfrei, Konfiguration konsistent, Alias und Tailwind-4-Integration korrekt, keine redundanten Pakete, keine Platzhalter. B1 sollte vor dem ersten Commit behoben werden.

**STATUS: FREIGEGEBEN**
