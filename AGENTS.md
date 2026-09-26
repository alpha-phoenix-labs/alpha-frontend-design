# AGENTS.md — CRAFTFLOW Frontend Bot Workspace

## Scope
Dieses Repository ist der einzige freigegebene Arbeitsbereich für das 6-Bot-UI-Team.
Kein Agent darf auf andere CRAFTFLOW-/ALPHA-Repositories zugreifen, deren Inhalte anfordern, kopieren, spiegeln oder verändern.

## Human Gate
Ohne ausdrückliche menschliche Freigabe sind verboten:
- produktive Deployments
- destruktive Änderungen
- kostenpflichtige Aktionen
- Zugriff auf neue Repositories oder externe Systeme
- Einbringen von Secrets, Tokens, Zugangsdaten oder produktiven Kundendaten

## Rollen und Schreibbereiche

### Chef
Aufgabe: Orchestrierung, Integration, Review und Delegation.
Schreibbereich:
- src/App.tsx
- src/main.tsx
- docs/
Chef koordiniert Änderungen außerhalb dieser Pfade vorab.

### Alpha-Spatial
Schreibbereich:
- src/components/canvas/
- src/scenes/

### Alpha-Surface
Schreibbereich:
- src/components/ui/
- src/styles/

### Alpha-Core
Schreibbereich:
- src/store/
- src/types/
- src/hooks/

### Alpha-QA
Lesezugriff auf das gesamte Repository.
Schreibbereich ausschließlich:
- audit/
Alpha-QA verändert keinen Produktivcode.

### Alpha-Deploy
Schreibbereich:
- package.json
- vite.config.ts
- tsconfig.json
- wrangler.toml
- dist/
- .github/workflows/ nur nach Freigabe durch Chef

## Prozess
1. Mensch kommuniziert ausschließlich mit Chef.
2. Chef zerlegt und delegiert.
3. Spezialisten ändern ausschließlich ihre freigegebenen Bereiche.
4. Chef integriert.
5. Alpha-QA prüft den integrierten Stand.
6. Bei STATUS: BLOCKIERT geht der Fehler an den zuständigen Agenten zurück.
7. Schleife bis STATUS: FREIGEGEBEN oder Human Gate.
8. Produktiv-Deployment nur nach ausdrücklicher menschlicher Freigabe.

## Sicherheitsregeln
- Keine .env-Dateien committen.
- Keine API-Keys, Tokens, Passwörter oder privaten Schlüssel committen.
- Keine produktiven Kundendaten.
- Keine Inhalte aus nicht freigegebenen Repositories übernehmen.
- Keine Umgehung von Branch-, Review- oder Human-Gate-Regeln.
- Keine Platzhalter als abgeschlossen melden.
