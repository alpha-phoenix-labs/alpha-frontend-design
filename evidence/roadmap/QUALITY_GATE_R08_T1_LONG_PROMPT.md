# QUALITY GATE R-08 / T1 – Langprompt-Grenztest (60-Node-Betriebsgrenze)

Stand: 2026-10-02 · Ergebnis: **FAIL, reproduziert (2/2)** · Kennzeichnung: BELEGT · ANNAHME · NICHT GEPRÜFT

## Lauf
| Feld | Wert |
|---|---|
| Run | 36997147458 (R-08 Large Workflow E2E, Stufe 60, `prompt_chars=7900`) |
| Start / Ende | 10:44:34Z / 10:49:18Z |
| FE-SHA | `97677df1af9b70002e11b68014a931723f354d52` (FE#62) |
| BE-SHA | `5db194c85f99580a65cbd0b07f294461658ba1e9` (Render `dep-davkf27f3r2c73a41p0g`) |
| Correlation ID | `craftflow-large-36997147458-1-n60` |
| jobId | `cmuqu70d500064ugqlliju81s` |
| Prompt-Länge | 7 897 Zeichen (Ziel 7 900 ± 20) |
| Workflow-ID (n8n) | – (nicht erreicht) |
| Execution-ID | – (nicht erreicht) |
| Token-Verbrauch / Kosten | 32 546 Tokens / 0,0135 USD |
| Generierungsdauer (BUILDER, 3 Versuche) | 224,3 s (66,1 s / 78,4 s / 79,8 s) |
| E2E-Laufzeit | 242,9 s |
| Drive-Datei-IDs | – (nicht erreicht) |
| Artifact | 11222073715 |

## Erfolgskriterien
| # | Kriterium | Ergebnis | Beleg |
|---|---|---|---|
| 1 | Auftrag akzeptiert | PASS | `createHttpStatus: 202` |
| 2 | Job erstellt | PASS | `cmuqu70d500064ugqlliju81s`, Render `WORKER_JOB START` 10:45:16Z |
| 3 | Workflow mit 60 Nodes generiert | **FAIL** | 3/3 BUILDER-Versuche abgelehnt, `nodeCount: null` |
| 4 | Package-Validation PASS | NICHT ERREICHT | |
| 5 | Secret-Scan PASS | NICHT ERREICHT | |
| 6 | n8n-Import PASS | NICHT ERREICHT | |
| 7 | Workflow aktivierbar | NICHT ERREICHT | |
| 8 | Execution erfolgreich | NICHT ERREICHT | |
| 9 | Drive-Archivierung COMPLETE | NICHT ERREICHT | `drive: null` |
| 10 | Alle 9 Artefakte vorhanden | NICHT ERREICHT | |
| 11 | Kein Retry wegen Promptgröße | PASS (eingeschränkt) | Keine Ablehnung des Prompts (kein `INVALID_PROMPT`); die 2 Retries kamen aus der Verbindungsprüfung. Ob die Promptlänge die Fehler auslöst: NICHT GEPRÜFT |
| 12 | Kein Truncation-Fehler | PASS | kein `LLM_OUTPUT_TRUNCATED`; Budget 14 000 Tokens je Versuch |
| 13 | Runtime-Truth PASS | PASS | `runtimeTruthMatch: true` |

## Wo der Lauf stoppt (BELEGT, Render-Logs)
| Versuch | Dauer | `BUILDER_REPAIR connectionIdRefs` | Fehlercode |
|---|---|---|---|
| 1 | 66,1 s | 120 | `INVALID_CONNECTION_TARGET:INVALID_FORMAT` |
| 2 | 78,4 s | 120 | `INVALID_CONNECTION_TARGET:INVALID_FORMAT` |
| 3 | 79,8 s | 120 | `INVALID_CONNECTION_TARGET:TRIGGER` |

Job-Status `FAILED` nach 235,3 s (`WORKER_JOB END`).

## Vergleich: gleicher Stand, Standardprompt (Run 36994530333, 10:16Z, 3 906 Zeichen)
| | Standard | T1 |
|---|---|---|
| BUILDER-Versuche | 1 (PASS) | 3 (FAIL) |
| `connectionIdRefs` repariert | 118 (= 59 Verbindungen × 2) | 120 je Versuch |
| Tokens | 11 828 | 32 546 |

## Bewertung
- Einziger Unterschied zum bestandenen Lauf 36994530333: die Prompt-Länge (zusätzlicher Block „Betriebskontext“). Backend, Frontend-App, Schritte und Node-Zahl sind identisch. BELEGT.
- Die Ablehnung kommt aus der bestehenden Verbindungsprüfung (`validateWorkflow`), nicht aus einem Prompt-Limit. BELEGT.
- 120 statt 118 reparierter Verweise deuten auf eine zusätzliche bzw. fehlerhafte Verbindung hin (Code `TRIGGER` = Verbindung auf den Auslöser). ANNAHME.
- Welcher Verbindungsverweis betroffen ist, steht nicht in den Logs: `BUILDER_REJECT` deckt nur Parameterfehler ab; die Liste der fehlerhaften Verweise steht nur im internen Retry-Feedback. NICHT GEPRÜFT.
- Reproduziert, siehe Wiederholung.

## Wiederholung (BELEGT)
| Feld | Wert |
|---|---|
| Run | 37000098816 (11:16:26Z – 11:20:46Z), FE `bac4ba9c1399ec77323a64f70fa9539b04c8c8cf`, BE `5db194c` |
| jobId | `cmuqvby0500074ugqie05d478` |
| Prompt-Länge | 7 897 Zeichen |
| BUILDER-Versuche | 3: `INVALID_CONNECTION_TARGET:INVALID_FORMAT` (69,5 s / 68,8 s / 69,6 s), je `connectionIdRefs` 120 |
| Job | `FAILED` nach 216,1 s; kein n8n, kein Drive |
| Artifact | 11223371475 |

Ergebnis über beide Läufe: Standardauftrag 60 Nodes 2/2 PASS (36905703518, 36994530333), Langprompt 60 Nodes 2/2 FAIL. `INVALID_FORMAT` heißt laut `lib/orchestrator/core.ts:155-157`: ein Verbindungsziel hat kein Text-`node`, kein `type: "main"` oder keinen ganzzahligen `index` ≥ 0. Welches Feld betroffen ist: NICHT GEPRÜFT (Ausgaben nicht gespeichert; DB-Lesezugriff blockiert, IP-Allowlist leer und bleibt unverändert).

## Entscheidung
BOSS 2026-10-02: Betriebsgrenze **50 Nodes**; 60 Nodes bleibt historisch erfolgreich getestete Obergrenze (Standardauftrag).
