# Audit 06b: Nachprüfung B1 auf Head `609f589` (26.09.2026, 14:56 Uhr MESZ)

Grundlage ist Audit 06 (`audit/2026-09-26-audit-06-craftflow-completion.md`, Urteil BLOCKIERT auf `a1111be`, einzig wegen B1).

## Umfang
`git diff a1111be..609f589` enthält nur `.github/workflows/cloudflare-deploy-test.yml` (Commit `9375e48`) und den Audit-06-Bericht. Der Quellcode ist unverändert. Alle übrigen Ergebnisse aus Audit 06 gelten daher weiter.

## B1: behoben
- Zeile 5 bis 9: `workflow_dispatch` hat die boolesche Eingabe `deploy` mit `default: false`.
- Zeile 47: Der Schritt `versions upload` hat als Bedingung die exakte Verneinung von Zeile 57. Pro Lauf läuft also genau einer der beiden Schritte.
- Zeile 57: `command: deploy` läuft nur bei `workflow_dispatch` auf `refs/heads/main` mit `deploy == true`. Ein PR oder ein manueller Start auf einem Feature-Branch kann nicht produktiv deployen.
- Zeile 52 und 62: `wranglerVersion: "4.141.0"` passt zur devDependency.
- Weiterhin gilt: nur `pull_request`, kein `pull_request_target`, `permissions: contents: read`, Secrets nur in `with:`, kein `echo`, kein `set -x`.
- Lauf 36243285507 auf `609f589` bestätigt das: Checkout, Install, Typecheck und Build sind grün, der Upload-Schritt lief, „Deploy to Cloudflare“ wurde übersprungen. Der CI-Check `build` ist grün.

## Separat, nicht Teil des Urteils
Der Upload scheitert mit `Authentication error [code: 10000]` und `Invalid access token [code: 9109]`. Das ist die Kategorie Auth/Token: Der Wert in `CLOUDFLARE_API_TOKEN` ist ungültig und muss von der Projektleitung ersetzt werden. Der Check „Workers Builds“ ist weiterhin ein externer Blocker außerhalb des Codes. L2, L3 und L5 sind bewusste Abweichungen.

## Urteil auf `609f589`
STATUS: FREIGEGEBEN
