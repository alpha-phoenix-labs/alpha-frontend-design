# Roadmap Punkt 8 – Härtungsphase große Workflows: Zwischenstand

Stand: 2026-10-02 10:20 UTC · Quelle: CRAFTFLOW_POST_M1_ROADMAP (20 Punkte), Punkt 8
Kennzeichnung: BELEGT = geprüft · ANNAHME · NICHT GEPRÜFT
Status: **IN ARBEIT** – 40 und 60 Nodes auf dem aktuellen Stand bestanden; 80, 100 und R-20-QUALITY offen.

## Ziel laut Roadmap
Viele Nodes, lange Prompts, große Reports, maximale Payloads.

## Werkzeug
Workflow `R-08 Large Workflow E2E` (`.github/workflows/large-workflow-e2e.yml`, FE#46), nur `workflow_dispatch` (Stufen 20/40/60/80/100, Bestätigung `R-08`), keine Promotion. Je Lauf ein echter Business-Auftrag über `control.vantarialabs.tech` → `api.vantarialabs.tech`: Login → Runtime-Pin → Auftrag → Generierung → n8n-Import/Ausführung → Approval → Drive → Readback. Ergebnis als `LARGE_WORKFLOW_SUMMARY` im Job-Log und als Artifact.

## Geprüfter Stand (BELEGT)
- Backend live `5db194c85f99580a65cbd0b07f294461658ba1e9` (BE#54), Render `dep-davkf27f3r2c73a41p0g`, live seit 2026-10-02 05:57 UTC; alle Deploys seit 2026-10-01 18:00 UTC mit `envUpdated: false`.
- Frontend `main` `d3e0672e347f03b219fd055302fb9e1089cb3c50` (FE#60, Pin auf `5db194c`).
- Seit BE#52 (QG-001/QG-002: Schema je Node-Typ, Qualitätsmechanismen, secret-freies Drive-Paket) war vor diesen Läufen keine große Stufe bestanden.

## Regression 2026-10-02 auf dem aktuellen Stand (BELEGT)

| Stufe | Run | Job | Nodes / Verbindungen | BUILDER-Versuche | n8n-Execution | Qualität | Drive | Tokens / Kosten | Dauer gesamt / BUILDER | Artifact |
|---|---|---|---|---|---|---|---|---|---|---|
| 40 | 36994286358 | `cmuqt35rn00024ugqcymuqc8j` | 40 / 39 | 1 | `82` (Import 490 ms, Ausführung 1 328 ms) | PASS, 1/1 Fall | COMPLETE, 9/9 Dateien in Drive nachgeprüft | 9 817 / 0,0039 USD | 83,0 s / 46,8 s | 11221410014 |
| 60 | 36994530333 | `cmuqt6idr00034ugqr24mswrk` | 60 / 59 | 1 | `83` (Import 107 ms, Ausführung 546 ms) | NOT_VERIFIED, 0 Fälle definiert | COMPLETE, 9/9 Dateien in Drive nachgeprüft | 11 828 / 0,0049 USD | 102,6 s / 67,9 s | 11220988865 |

Für beide Läufe gilt: Runtime-Truth PASS, Cloudflare-Version vorher = nachher (`817dfea7-9ab7-4b14-b30c-a7870c03ffe2`), `cleanup: CLEANUP_DISABLED`.
Drive-Nachweis: Dateien `HandwerkFlows_<jobId>_*` in `N8N-AGENT_SWARM/01-AUFTRAEGE`, `02-WORKFLOWS`, `03-TEST`, `04-FERTIG` (Konto az9421tz@gmail.com), per Drive-API am 2026-10-02 gefunden. Größen: `FINAL_workflow.json` 19 742 Byte (40) bzw. 25 858 Byte (60); `n8n_readback_workflow.json` 20 840 Byte (40) bzw. 26 949 Byte (60).

## Vergleich mit den Läufen vom 2026-10-01 (Backend `321c715`, vor QG-001)

| Stufe | Run | BUILDER-Versuche | Tokens / Kosten | Dauer gesamt | Drive heute |
|---|---|---|---|---|---|
| 40 | 36894147895 | NICHT GEPRÜFT | NICHT GEPRÜFT | NICHT GEPRÜFT | NICHT GEPRÜFT (damals lief noch das Cleanup) |
| 60 | 36905703518 | 3 | 33 849 / 0,0168 USD | 290,3 s | keine Pipeline-Dateien mehr (Cleanup `CLEANUP_OK`) |

Die 60er-Stufe brauchte heute 1 statt 3 BUILDER-Versuche und rund ein Drittel der Tokens. Ob das an BE#46–#54 oder an der Modellstreuung liegt, ist NICHT GEPRÜFT (je ein Lauf).

## Abweichungen im Zeitraum (BELEGT)
- Run 36973674376 (06:28 UTC): `BUSINESS_E2E_RUNTIME_TRUTH_MISMATCH`. Der Frontend-Pin stand auf `1b06277`, live war `5db194c`. Behoben durch FE#60. Kein Job, keine Kosten.
- Run 36993869520 (10:09 UTC): `BLOCKED_EXTERNAL / EXTERNAL_DEPENDENCY_PIKAPODS`, `/healthz` und `/api/v1/workflows` 3× `502 text/html` (Runbook `docs/runbooks/pikapods-outage.md`). Kein Job, keine Kosten. Kein Produktfehler.
- R-20-QUALITY Run 36968257610 (05:17 UTC, Backend `1b06277`): FAIL `INVALID_PARAMETERS` in allen 3 BUILDER-Versuchen. BE#54 macht die Ursache messbar (Log `BUILDER_REJECT`); ein erneuter Lauf auf `5db194c` steht aus.

## Offen
1. Stufe 80 und Stufe 100. Das konfigurierte Node-Limit (`MAX_WORKFLOW_NODES`) ist NICHT GEPRÜFT; belegt ist nur ≥ 60.
2. R-20-QUALITY (Stufe 20 mit Qualitätsmechanismen) auf `5db194c`.
3. Ob n8n Webhook-`options: null` akzeptiert (seit BE#54 zulässig), ist NICHT GEPRÜFT.
4. Je Stufe nur ein Lauf; Reproduzierbarkeit der großen Stufen NICHT GEPRÜFT.
