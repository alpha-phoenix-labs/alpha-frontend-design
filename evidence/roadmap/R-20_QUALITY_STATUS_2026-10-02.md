# R-20-QUALITY – Status und Ursachenprüfung

Stand: 2026-10-02 · Quelle: `CRAFTFLOW_POST_M1_ROADMAP.md`, Arbeitsreihenfolge Schritt 3
Kennzeichnung: BELEGT = geprüft · ANNAHME · NICHT GEPRÜFT
Status: **OFFEN** – ein Lauf FAIL (Backend `1b06277`); Lauf auf dem aktuellen Backend `5db194c` steht aus (Kostenfreigabe).

## Definition (unverändert)
`R-20-QUALITY_definition_20261001.json` (Drive `QUALITY_GATE/20-NODES`, ID `1H3jO0WAOd202M4qj-NyVGtZXKqTFUTV4`), Status `DEFINED_BEFORE_RUN`. Fälle TC-1 SUCCESS, TC-2 TRANSIENT_ERROR, TC-3 VALIDATION_ERROR, AUTH-REJECT; Mechanismen WEBHOOK_AUTH, CONDITION, STOP_AND_ERROR, RETRY, ERROR_WORKFLOW. Seither nicht geändert (BELEGT, Abgleich mit `scripts/large-workflow-prompts.mjs` Stufe 20; Umlaute dort ausgeschrieben). Der Slot heißt in der Definition noch `CRED_SLOT_WEBHOOK_AUTH`, im Code seit dem Credential-Slot-Vertrag `CRED_SLOT_HTTP_WEBHOOK_AUTH` (nur Benennung).

## Lauf 1 (BELEGT)
| Feld | Wert |
|---|---|
| Run | 36968257610 (2026-10-02 05:17 UTC), FE `780f557`, BE `1b06277` |
| Job | `cmuqii7in0002b8emgndvb6vi` |
| Ergebnis | FAIL, `INVALID_PARAMETERS` in 3/3 BUILDER-Versuchen; kein n8n, kein Drive |
| Kosten | 19 699 Tokens, 0,0074 USD |

## Ursachenprüfung (Stand Code)
- Auf `1b06277` gab es zwei Quellen für den unspezifischen Code `INVALID_PARAMETERS`: fehlendes `parameters` (jeder Node-Typ) oder nicht leere Webhook-`options`. Welche es war: NICHT GEPRÜFT (fehlgeschlagene Ausgaben werden nicht gespeichert).
- BE#54 (`5db194c`, live seit 05:57 UTC) trennt die Fälle: `INVALID_PARAMETERS:<TYP>` bzw. `WEBHOOK_OPTIONS_NOT_ALLOWED`, internes Feedback mit Node-Index/Feldpfad/Optionsschlüssel und Log `BUILDER_REJECT`. Der nächste Lauf macht die Ursache sichtbar. BELEGT (Code, Tests).
- Seit BE#54 bestanden 40 und 60 Nodes (Standardauftrag) im 1. BUILDER-Versuch; ein Webhook-Parameterfehler trat dort nicht auf. BELEGT (Runs 36994286358, 36994530333).

## Voraussetzungen, die nur der Lauf zeigt (NICHT GEPRÜFT, Env-Werte werden nicht gelesen)
- `HANDWERKFLOWS_TEST_FIXTURES=1` (sonst TC-2 `NOT_VERIFIED`).
- `api.vantarialabs.tech` in `ALLOWED_HOSTS` (sonst `DESTINATION_NOT_ALLOWED`).
- Test-Webhook-Auth-Konfiguration (`N8N_TEST_WEBHOOK_AUTH_*`; sonst Auth `NOT_VERIFIED`). Neue Secrets werden nicht angelegt.
- Ob n8n Webhook-`options: null` akzeptiert (seit BE#54 zulässig).

## Nächster Lauf
Stufe 20 auf FE `main`, BE `5db194c`, Definition v1 unverändert. Erwartete Kosten ca. 20 000 Tokens / ≈ 0,01 USD (ANNAHME aus Lauf 1). Gate laut Definition: alle 4 Fälle PASS, Webhook-Auth VERIFIED, Fehler-Workflow importiert und ausgeführt, Audit-Kette und Drive-Paket vollständig, Secret-Scan PASS. Fehlende Voraussetzung = `NOT_VERIFIED` (kein PASS), Testfall-Fehler = `FAIL`.
