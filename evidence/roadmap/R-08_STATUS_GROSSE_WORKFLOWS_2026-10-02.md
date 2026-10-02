# Roadmap Punkt 8 – Härtungsphase große Workflows: Zwischenstand

Stand: 2026-10-02 10:20 UTC · Quelle: CRAFTFLOW_POST_M1_ROADMAP (20 Punkte), Punkt 8
Kennzeichnung: BELEGT = geprüft · ANNAHME · NICHT GEPRÜFT
Status: **IN ARBEIT** – Betriebsgrenze 50 Nodes festgelegt; 40 und 60 Nodes (Standardauftrag) auf dem aktuellen Stand bestanden, 60 Nodes mit Langprompt reproduzierbar FAIL; T2, R-20-QUALITY und 8b offen.

BOSS-Entscheidung 2026-10-02 (aktualisiert): Betriebsgrenze **50 Nodes**. Das System wird nur vom Betreiber bedient; Aufträge über 50 Nodes werden nicht angefordert. Stufen 80/100 sind nicht geplant.
- Begründung: 40 Nodes PASS, 60 Nodes Standardauftrag PASS, 60 Nodes mit Langprompt (7 897 Zeichen) reproduzierbar FAIL (T1, s. u.).
- **60 Nodes** bleibt als historisch erfolgreich getestete Obergrenze dokumentiert (Standardauftrag 3 906 Zeichen, Runs 36905703518 und 36994530333); sie ist keine Betriebsgrenze.
- Die vorläufige Festlegung „60 Nodes“ vom selben Tag ist damit ersetzt.

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
1. Lange Prompts und Payload-Grenzen: Prompt-Limit im Code 8 000 Zeichen (`lib/orchestrator/core.ts:37`, `app/api/orchestrator/route.ts:101`), getestet: 3 906 Zeichen PASS, 7 897 Zeichen bei 60 Nodes FAIL (T1). Fallpayload je Testfall ≤ 2 000 Zeichen (`lib/orchestrator/quality.ts:44`). Das konfigurierte Node-Limit (`MAX_WORKFLOW_NODES`) ist NICHT GEPRÜFT; belegt ist nur ≥ 60; es wird betrieblich nicht über 50 angefordert (s. o.).
2. R-20-QUALITY (Stufe 20 mit Qualitätsmechanismen) auf `5db194c`.
3. Ob n8n Webhook-`options: null` akzeptiert (seit BE#54 zulässig), ist NICHT GEPRÜFT.
4. Je Stufe nur ein Lauf; Reproduzierbarkeit der großen Stufen NICHT GEPRÜFT.
5. T1 Langprompt (60 Nodes, 7 897 Zeichen): **reproduzierbar FAIL** – Run 36997147458 (10:44 UTC) und Run 37000098816 (11:16 UTC), je 3/3 BUILDER-Versuche `INVALID_CONNECTION_TARGET` (`INVALID_FORMAT`, einmal `TRIGGER`). Begründung der 50-Node-Grenze. Genaues Feld NICHT GEPRÜFT (fehlgeschlagene BUILDER-Ausgaben werden nicht gespeichert; DB-Lesezugriff durch leere IP-Allowlist blockiert, Allowlist bleibt unverändert). Evidence: `QUALITY_GATE_R08_T1_LONG_PROMPT.md`.
6. Für einen Lauf an der Betriebsgrenze 50 hat das Werkzeug keine Stufe 50 (nur 20/40/60/80/100); NICHT GEPRÜFT.

## 8b Graph-Integrität (Hardening)
BOSS-Entscheidung 2026-10-02 (QA-Audit), Teil der offiziellen Roadmap (`CRAFTFLOW_POST_M1_ROADMAP.md`, Punkt 8b). Nur Dokumentation; nicht implementiert.

| Regel | Heute im Code (BE `5db194c`, read-only geprüft) |
|---|---|
| Reachability Validation – jede Node vom Trigger erreichbar | nicht geprüft; `assertAcyclic` (`lib/orchestrator/core.ts`) prüft nur Zyklen, ausgehend von jeder Quelle |
| Unconnected Node Detection – keine isolierten Nodes | teilweise: offene IF-/Fehlerausgänge → `UNCONNECTED_BRANCH_OUTPUT`; komplett isolierte Nodes werden akzeptiert |
| Duplicate Connection Detection – keine doppelten Verbindungen zwischen denselben Nodes | nicht geprüft; Verbindungsprüfung kennt nur Format, unbekannte Ziele und Ziel = Trigger |

Abnahme je Regel (bei späterer Umsetzung): Negativtest belegt die Lücke auf dem alten Stand, Positivtest belegt, dass bestehende gültige Workflows (Regression 40 und Betriebsgrenze 50) weiter bestehen.
Nicht Bestandteil von 8b: Readback Comparison (→ Punkt 9), Branch-/Depth-Limits (→ Punkt 18), Graph-Optimierung (→ Backlog).
R-20-QUALITY: Definition v1 (archiviert 2026-10-01) bleibt unverändert; Graph-Integrität wird erst nach Umsetzung von 8b als eigene Version (v1.1) für spätere Läufe aufgenommen.

## Reihenfolge ab hier (BOSS-Entscheidung 2026-10-02)
1. T1 Langprompt – erledigt (reproduzierbar FAIL → Betriebsgrenze 50)
2. T2 Prompt-Limit
3. R-20-QUALITY
4. 8b Graph-Integrität (Hardening)
5. Regression 40 und Betriebsgrenze 50
6. Punkt 9 Recovery
