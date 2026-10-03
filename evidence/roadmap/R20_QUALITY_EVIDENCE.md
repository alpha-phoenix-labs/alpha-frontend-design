# H1 – R-20-QUALITY Evidence

Stand: 2026-10-02 · Plan: BUILDER – HARDENING EXECUTION PLAN, Phase H1 · Kennzeichnung: BELEGT · ANNAHME · NICHT GEPRÜFT
Ergebnis: **FAIL** – Exit-Kriterium (PASS) nicht erreicht. H2–H7 nicht begonnen.

## Lauf (BELEGT)
| Feld | Wert |
|---|---|
| Run / Artifact | 37029807555 / 11237286175 (R-08 Large Workflow E2E, Stufe 20) |
| FE / BE | `222ed4885140f2fbda2ac8795ebeb5628fa6afd5` / `0257497965f340506132a35e4d9f149d29a88136` |
| jobId | `cmur54m770003k8hyo20h12ye` |
| Correlation ID | `craftflow-large-37029807555-1-n20` |
| Execution-ID / Workflow-ID | – / – (nicht erreicht) |
| Runtime Truth | PASS (`runtimeTruthMatch: true`) |
| Kosten | 19 720 Tokens / 0,0074 USD |
| Dauer | gesamt 144,8 s; BUILDER 121,4 s (45,8 s / 36,0 s / 39,6 s) |
| Drive Evidence | keine (`drive: null`, Pipeline vor Import beendet) |
| Prompt | 4 128 Zeichen, Definition v1 unverändert |
| Ergebnis | `BUSINESS_E2E_NOT_AT_APPROVAL:FAILED`, `createErrorMessage: REPEATED_REJECTED_DESTINATION` |
| Cloudflare | vorher = nachher (`b1ee1e48-73cc-411a-92b1-f25e1c0544e4`) |

## BUILDER-Versuche (BELEGT, Render-Logs `srv-daqk0sp7lnhs73d9nr7g`)
| Versuch | Dauer | `connectionIdRefs` | Fehlercode | `BUILDER_REJECT` |
|---|---|---|---|---|
| 1 | 45,8 s | 37 | `PARAMETER_NOT_ALLOWED:HTTPREQUEST` | kein Eintrag |
| 2 | 36,0 s | – | `REPEATED_REJECTED_DESTINATION` | kein Eintrag |
| 3 | 39,6 s | – | `REPEATED_REJECTED_DESTINATION` | kein Eintrag |

## Ursachenkette (Code BE `0257497`, read-only)
1. Versuch 1: Ein HTTP-Request-Node enthält einen Parameter außerhalb der Liste in `lib/orchestrator/node-schemas.ts:60` → `node-schemas.ts:143` `fail('PARAMETER_NOT_ALLOWED:HTTPREQUEST')`. BELEGT (Code).
2. Dieser Fehler ist kein `NodeRejectError` → kein `BUILDER_REJECT`, kein Node-Index, kein Feldpfad, kein Parametername im Log oder Retry-Feedback. Welcher Parameter: NICHT GEPRÜFT. BELEGT (Code `agents.ts`, BUILDER-catch).
3. Im catch werden alle HTTP-Ziel-Hosts, die nicht in `ALLOWED_HOSTS` stehen, unabhängig vom eigentlichen Fehler in `builderRejectedHosts` übernommen (`agents.ts`, `rejectedDestinationHosts`). BELEGT (Code).
4. Versuch 2 und 3 brechen vor jeder Validierung mit `REPEATED_REJECTED_DESTINATION` ab, weil derselbe Host erneut verwendet wird (`agents.ts`, `repeatedRejectedDestinationHosts`). BELEGT (Code + Log).
5. Daraus folgt: Mindestens ein HTTP-Ziel-Host des Workflows steht nicht in der Live-`ALLOWED_HOSTS`. BELEGT (zwingend aus 3+4).
6. Dass es `api.vantarialabs.tech` ist (vom Prompt für TC-2 verlangt: `https://api.vantarialabs.tech/api/test-fixture/transient`), ist ANNAHME; Hosts werden nicht geloggt, Env-Werte werden nicht gelesen. Deckt sich mit der offenen Voraussetzung in `R-20_QUALITY_STATUS_2026-10-02.md`.

## Vergleich
| Lauf | BE | Ergebnis |
|---|---|---|
| 36968257610 | `1b06277` | FAIL `INVALID_PARAMETERS` 3/3 |
| 37029807555 | `0257497` | FAIL `PARAMETER_NOT_ALLOWED:HTTPREQUEST` → `REPEATED_REJECTED_DESTINATION` 2/2 |

## Offene Entscheidungen (keine Aktion ohne Freigabe)
- Env `ALLOWED_HOSTS` prüfen/ergänzen (Render-Env; Lesen/Ändern nur mit ausdrücklicher Freigabe).
- Diagnose-Lücke: `PARAMETER_NOT_ALLOWED` ohne Lokalisierung (gleiche Lücke wie vor BE#55 bei Verbindungen).

## H1-Retry nach ALLOWED_HOSTS-Änderung (2026-10-02 17:37 UTC)
Ergebnis: **FAIL** – Exit-Kriterium (PASS) nicht erreicht. H2 nicht gestartet.

### Voraussetzung (Render, read-only)
| Feld | Wert |
|---|---|
| Deploy | `dep-davumu942hec73e8d9og`, live seit 17:36:51Z, `deploy_ended: succeeded` |
| Backend-SHA | `963bad465b5d7ed76fe55a5538d77a856e8969a1` (unverändert) |
| Trigger | `manual` (Betreiberkonto) |
| `envUpdated` | **`false`** (Render-Event) – ob der neue `ALLOWED_HOSTS`-Wert im Prozess wirksam ist: NICHT GEPRÜFT |

### Lauf (BELEGT)
| Feld | Wert |
|---|---|
| Run / Artifact | 37041965708 / 11241659052 |
| FE / BE | `6e0c3029ceaa30732c56a9a4cfdd677047ddf3d0` / `963bad4` |
| jobId | `cmur8xwh10000si1d0uxuux8r` |
| Workflow-ID / Execution-ID | – / – (nicht erreicht) |
| Runtime Truth | PASS |
| Kosten | unbekannt (`costUnknown: true`) |
| Dauer | gesamt 19,4 s; BOSS 1,6 s; ARCHITECT 9,8 s |
| Drive | keiner (`drive: null`) |
| Ergebnis | `BUSINESS_E2E_NOT_AT_APPROVAL:BLOCKED`, `createErrorMessage: INVALID_PLAN` |

### Fehlercode je Schritt (Render-Logs)
| Schritt | Status | Fehlercode |
|---|---|---|
| BOSS | PLANNED | – |
| ARCHITECT (Versuch 1) | **BLOCKED** | **`INVALID_PLAN`** |
| BUILDER | nicht erreicht | – |

`BUILDER_REJECT`: keiner (BUILDER nicht erreicht).

### Root Cause (Stand Evidence)
- BELEGT: Der Lauf stoppt in der Plan-Prüfung des ARCHITECT; `INVALID_PLAN` blockiert ohne Retry.
- BELEGT (Code BE `963bad4`): `INVALID_PLAN` hat 9 Quellen – `lib/orchestrator/agents.ts:136–140` (Plan-Grundfelder, `plannedNodeCount`, `webhookAuthRequired`) und `lib/orchestrator/quality.ts:31–48` (Qualitätsmechanismen und Fehlerfälle: Anzahl, Feldlängen, `payloadJson`, Zuordnung `kind`/`expected`). Kein Log nennt die auslösende Quelle.
- NICHT GEPRÜFT: welche der 9 Quellen ausgelöst hat (ARCHITECT-Ausgabe wird nicht gespeichert, nicht geloggt).
- NICHT GEPRÜFT: ob die ALLOWED_HOSTS-Änderung wirksam war (`envUpdated: false`; BUILDER, wo der Host geprüft wird, nicht erreicht).

### Vergleich H1-Läufe
| Lauf | BE | ARCHITECT | BUILDER | Ergebnis |
|---|---|---|---|---|
| 36968257610 | `1b06277` | bestanden | `INVALID_PARAMETERS` ×3 | FAIL |
| 37029807555 | `0257497` | bestanden | `PARAMETER_NOT_ALLOWED:HTTPREQUEST`, `REPEATED_REJECTED_DESTINATION` ×2 | FAIL |
| 37041965708 | `963bad4` | **`INVALID_PLAN`** | nicht erreicht | FAIL |

## H1-Lauf mit PLAN_REJECT-Diagnose (2026-10-03 05:35 UTC)
Ergebnis: **FAIL** – `INVALID_PLAN` exakt lokalisiert. H2 nicht gestartet.

| Feld | Wert |
|---|---|
| Run / Artifact | 37100279628 / 11265836007 |
| FE / BE | `bb8389657a5bdb69ad9f55dac9396e7612bb9ec3` / `e54121464e277641affe08683a9fd1f7ca6ddcf1` (BE#57, Render `dep-db090d2vcj2c739359dg`) |
| jobId | `cmurykker00029qwglhpy1kt7` |
| Workflow-ID / Execution-ID | – / – (nicht erreicht) |
| Runtime Truth | PASS |
| Kosten | unbekannt (`costUnknown: true`) |
| Dauer | gesamt 17,4 s; BOSS 0,9 s; ARCHITECT 12,0 s |
| Drive | keiner (`drive: null`) |
| Ergebnis | `BUSINESS_E2E_NOT_AT_APPROVAL:BLOCKED`, `INVALID_PLAN` |

### PLAN_REJECT (Render-Log, 05:35:46Z, BELEGT)
`{"event":"PLAN_REJECT","jobId":"cmurykker00029qwglhpy1kt7","reason":"MECHANISM_ID_FORMAT","index":2,"field":"requirementId"}`

### Exakte Quelle (BELEGT)
- Prüfung: `lib/orchestrator/quality.ts`, `parseQualityMechanisms`, `requirementId` muss `^[A-Za-z0-9._-]{1,40}$` erfüllen (`ID`).
- Betroffen: `qualityMechanisms[2].requirementId` der ARCHITECT-Ausgabe.
- Die übrigen Kandidaten sind für diesen Lauf ausgeschlossen: die Prüfungen laufen in fester Reihenfolge, Plan-Grundfelder, `plannedNodeCount` und die Mechanismen 0–1 haben bestanden; Fehlerfälle wurden nicht mehr geprüft.
- Der konkrete Wert ist nicht geloggt (bewusst, keine Nutzdaten). Welches Zeichen bzw. welche Länge die Regel verletzt: NICHT GEPRÜFT.
- Ob Lauf 37041965708 (gleicher Code, ohne Diagnose) dieselbe Quelle hatte: NICHT GEPRÜFT.

## H1-Lauf nach ARCHITECT-Retry (2026-10-03 06:40 UTC)
Ergebnis: **FAIL**.

| Feld | Wert |
|---|---|
| Run / Artifact | 37103829868 / 11267160996 |
| FE / BE | `48fab927122cd85ebe51790f584033e0f9ca3990` / `5b1b15d5c661b7fccd63cd302f2e00da76e78ba8` (BE#59) |
| jobId | `cmus0wvj700024wgpv3o7jzr5` |
| Runtime Truth | PASS |
| ARCHITECT | PASS per Retry (2 Aufrufe, 16,9 s); `PLAN_REJECT` 1× `MECHANISM_ID_FORMAT`, index 2, `requirementId`; kein `PLAN_REPAIR` |
| BUILDER | FAIL 3/3: V1 `PARAMETER_NOT_ALLOWED:HTTPREQUEST`, V2–V3 `REPEATED_REJECTED_DESTINATION`; kein `BUILDER_REJECT` |
| Workflow-ID / Execution-ID | – / – |
| Tokens / Kosten | 21 878 / 0,0079 USD (gesamt; Aufteilung NICHT GEPRÜFT) |
| Laufzeit | 110,7 s |
| Drive | keiner (0/9) |

## Status H1 (BOSS-Entscheidung 2026-10-03, Architektur-Gate 1)
**Durch Architekturentscheidung ersetzt, historisch FAIL.** Die monolithische H1-Reparaturschleife ist gestoppt; keine weitere H1-Ausführung vor dem modularen Prototyp (`evidence/architecture/CRAFTFLOW_MODULAR_20_NODE_SPEC_v1.0.md`).
Bekannte Legacy-Befunde (offen, nicht weiter verfolgt im Monolith-Pfad):
- `PARAMETER_NOT_ALLOWED:HTTPREQUEST` ohne Lokalisierung (Parametername nicht geloggt).
- Mindestens ein HTTP-Zielhost nicht in der Live-`ALLOWED_HOSTS` (`REPEATED_REJECTED_DESTINATION`); welcher Host, NICHT GEPRÜFT.
