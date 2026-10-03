# Offizielle Betriebsgrenze 40 Nodes

Stand: 2026-10-02 · BOSS-Entscheidung „40 NODE EVIDENCE – OFFIZIELLE BETRIEBSGRENZE“ · Kennzeichnung: BELEGT · ANNAHME · NICHT GEPRÜFT
Evidence-Status: **ABGENOMMEN** · Freigabestatus: **OFFIZIELLE BETRIEBSGRENZE = 40 NODES**
**Seit 2026-10-03 historische Monolith-Grenze** [BOSS-Entscheidung 2026-10-03, Architektur-Gate 1]: neue Workflows entstehen als Parent + Module mit maximal 20 fachlichen Nodes je Modul (`evidence/architecture/CRAFTFLOW_MODULAR_20_NODE_SPEC_v1.0.md`); keine neuen 40-/60-/100+-Node-Einzelworkflows. Die Gültigkeitsbedingung H1–H6 → H7 unten ist damit gegenstandslos (H1 und H7 durch den modularen Pfad ersetzt).

Ersetzt: Betriebsgrenze 50 Nodes (BOSS-Entscheidung 2026-10-02, FE#64).

## Gültigkeit
Bis zum erfolgreichen Abschluss von H1 R-20-QUALITY, H2 Graph-Integrität, H3 Builder Hardening, H4 Recovery, H5 Security und H6 Performance (BUILDER – HARDENING EXECUTION PLAN). Danach Requalifizierung 60 Nodes (H7).

## Evidence 40 Nodes (BELEGT, `R-08_STATUS_GROSSE_WORKFLOWS_2026-10-02.md`)
| Feld | Wert |
|---|---|
| Run / Artifact | 36994286358 / 11221410014 |
| Job | `cmuqt35rn00024ugqcymuqc8j` |
| Backend / Frontend | `5db194c` / `d3e0672` |
| Nodes / Verbindungen | 40 / 39 |
| BUILDER | PASS im 1. Versuch |
| Runtime Truth | PASS |
| n8n Import / Execution | PASS (Import 490 ms) / PASS, Execution-ID `82` (1 328 ms) |
| Drive | COMPLETE, 9/9 Dateien per Drive-API nachgeprüft, `FINAL_workflow.json` 19 742 Byte |
| Kosten | 9 817 Tokens / 0,0039 USD |
| Dauer | gesamt 83,0 s / BUILDER 46,8 s |

## Historische Bewertung (BELEGT)
| Stufe | Ergebnis | Runs |
|---|---|---|
| 40 | PASS | 36994286358 (BE `5db194c`); 36894147895 (2026-10-01, BE `321c715`, Details NICHT GEPRÜFT) |
| 50 | FAIL | 37003304513 (`TRIGGER`) |
| 60 Standard | nicht reproduzierbar | PASS 36905703518, 36994530333; FAIL 37028229525 (BE `0257497`, `TRIGGER` Node 59 / `INVALID_FORMAT` Node 0) |
| 60 Langprompt | FAIL | 36997147458, 37000098816 |

## Einschränkung
Auf dem aktuellen Backend `0257497` (BE#55) gibt es keinen 40-Node-Lauf. NICHT GEPRÜFT; Nachweis folgt mit H6 (Referenz 40 Nodes, 3 Läufe).
