# CRAFTFLOW / HANDWERKERFLOW – Post-M1-Roadmap, Priorität 1–20

Quelle: BOSS-Vorgabe „CRAFTFLOW_POST_M1_ROADMAP_1-20“ (Wortlaut der Punkte 1–20 unverändert; Kopfzeilen weggelassen).
Änderungen nur per BOSS-Entscheidung; jede Ergänzung ist datiert und mit [BOSS-Entscheidung …] gekennzeichnet.

## Zielbild ab 2026-10-03: modulare 20-Node-Produktfabrik [BOSS-Entscheidung 2026-10-03, Architektur-Gate 1]
- Zielarchitektur: Parent + modulare n8n-Sub-Workflows; **maximal 20 fachliche Nodes je Modul**; Parent im ersten Prototyp maximal 7 Nodes. Spezifikation: `evidence/architecture/CRAFTFLOW_MODULAR_20_NODE_SPEC_v1.0.md`.
- Keine neuen monolithischen Einzelworkflows (40/60/100+ Nodes) und keine neuen Großworkflow-Tests. Die bestehende Großworkflow-Evidence bleibt historisch erhalten.
- Die Betriebsgrenze 40 Nodes gilt nur noch als **historische Monolith-Grenze** (`OPERATING_LIMIT_40_NODES_2026-10-02.md`).
- H1 (R-20-QUALITY) und H7 (60-Node-Requalifizierung) des Hardening-Plans sind **durch den modularen Pfad ersetzt**; H1 ist historisch FAIL (`R20_QUALITY_EVIDENCE.md`). Neuer Qualitätsnachweis: modularer Prototyp bis n8n-Readback.
- Löschstopp bleibt aktiv: nichts löschen, 0 SAFE_DELETE, keine Migration vor validiertem Ersatz; Legacy nur dokumentarisch markiert, keine Änderung in n8n.
- Nächste Gates (je eigene Freigabe): 2 Validator-Erweiterung (Parent/Sub-Workflows) → 3 Job-Datenmodell → 4 Importlogik → 5 Modul A → 6 Modul B → 7 Parent → 8 erster kostenpflichtiger Prototyplauf → 9 QA-Abnahme.
- **Gate 2 Validator-Erweiterung: ABGESCHLOSSEN** [BOSS-Entscheidung 2026-10-03, „GO MERGE 60“ und „GO MERGE 77“]
  - Backend: BE#60, Merge `f22cb25c3cec5848938627148b185ccb457608f3`; Render-Deploy `dep-db0f28lckfvc73co22dg` live.
  - Inhalt: `WorkflowKind` main|error|parent|module, `ValidatorContext`, Execute Sub-Workflow 1.2/1.3, Execute Sub-Workflow Trigger 1.1, Parent ≤ 7 / Modul ≤ 20 Nodes, Reachability, branch-genaue Duplicate-Edge-Prüfung, Modulaufrufgraph. main/error unverändert. Grundlage: n8n 2.40.7 (`n8n-nodes-base` 2.40.2).
  - Runtime-Truth-Pin: FE#77, Merge `3ae09867645a635e0757f94dd4ddeb2dfa75f515`.
  - FE-Kette auf `3ae0986` vollständig grün:

    | Schritt | Run-ID |
    |---|---|
    | CI | 37122478450 |
    | Cloudflare Deploy Test | 37122478578 |
    | Real E2E | 37122478725 |
    | Production Promotion | 37122550799 |
    | Post-Deploy Production Gate | 37122585750 |

  - Nächstes Gate: 3 Job-Datenmodell. Zuerst wird die Spezifikation am Human Gate vorgelegt; keine Implementierung ohne GO.
- **Gate 4 Importlogik: ABGESCHLOSSEN** [BOSS-Entscheidung 2026-10-03, „GO MERGE 62“, „GO MERGE 81“ und „Gate 4 als ABGESCHLOSSEN dokumentieren“]
  - Spezifikation: `GATE4_IMPORTLOGIK_SPEC_v1.0-final`, Revision 4.1, SHA-256 `c87fee5cc92acddb4fd4c0fd31fa05805cdb791388c9cfedd2c601844036acdf`; QA-GO auf Head `9ca7c60`.
  - Backend: BE#62, Merge `bdf06376d63083a8d93c3269ca140f59050643c4`; `verify` 37148099625 success; Render-Deploy `dep-db0lftjm8hqs73d87rp0` live.
  - Inhalt: `lib/orchestrator/modular-import.ts`. Sequenzieller Import mit Fake-`ImportPort` (nur `create`/`read`), 14 Übergänge, normalisierter Projektions-Hash, Readback-Matrix, Evidence vor `readback_validated`, Rollback ohne Kompensation. Dazu `modular.ts` E2.1–E2.3 und 37 Tests. Keine echten n8n-Aufrufe; zur Laufzeit wird der Code nicht aufgerufen.
  - Runtime-Truth-Pin: FE#81, Merge `95c7e7dd21ec30d04a19ca190c35821b4ccc6243`.
  - FE-Kette auf `95c7e7d`:

    | Schritt | Run-ID | Ergebnis |
    |---|---|---|
    | CI | 37148408146 | success |
    | Cloudflare Deploy Test | 37148407959 | success |
    | Real E2E | 37148407970 | failure: `BUSINESS_E2E_DRIVE_NOT_COMPLETE` |
    | Production Promotion | 37148469104 | skipped |
    | Post-Deploy Production Gate | 37148472608 | skipped |

  - Real E2E im Detail: Runtime Truth `matches=true` (bdf0637), Pipeline bis `WAITING_FOR_APPROVAL`, n8n-Teil bestanden; danach `drive.status=null` und keine Drive-File-IDs. Gleiches Bild wie Real E2E 37140018914 auf Backend `55c3eac`, also vor Gate 4. Ein Zusammenhang mit Gate 4 ist nicht belegt.
  - Der Abschluss erfolgt per BOSS-Entscheidung trotz roter Kette. Die Production Promotion des Frontends `95c7e7d` hat nicht stattgefunden.
  - Drive COMPLETE wird als separater Operations-Incident weitergeführt; nicht Teil von Gate 4 oder Gate 5.
  - Nächstes Gate: 5 Modul A (Ingestion & Validation). Zuerst wird die Spezifikation am Human Gate vorgelegt; keine Implementierung ohne GO.

1. Alte Diagnose-PRs #28 / #35 / #37 schließen und dokumentiert archivieren.
2. n8n-Testdaten bereinigen: importierte Test-Workflows und alte Test-Executions kontrolliert entfernen.
3. Google-Drive-Testartefakte bereinigen und Cleanup-Regel für künftige E2E-Läufe festlegen.
4. Backend-Testjobs/DB-Reste bereinigen bzw. sicheren Cleanup-Pfad definieren.
5. Automatisches E2E-Cleanup implementieren: correlationId/jobId-basiert, fail-safe, niemals Produktionsdaten außerhalb des Testlaufs löschen.
6. Härtungsphase starten – Fehlerfälle: 401 / 403 / 404 / 429 / 5xx / Timeout / Provider-Ausfall / n8n-Ausfall.
7. Härtungsphase – Last und Parallelität: mehrere gleichzeitige Aufträge, Race Conditions, Idempotency, Duplicate Requests.
8. Härtungsphase – große Workflows: viele Nodes, lange Prompts, große Reports, maximale Payloads.
   - 8b – Graph-Integrität (**Hardening**) [BOSS-Entscheidung 2026-10-02, QA-Audit]:
     - Reachability Validation: jede Node muss vom Trigger erreichbar sein.
     - Unconnected Node Detection: isolierte Nodes sind verboten.
     - Duplicate Connection Detection: keine doppelten Verbindungen zwischen denselben Nodes.
     - Nicht Bestandteil von 8b: Readback Comparison (→ 9), Branch-/Depth-Limits (→ 18), Graph-Optimierung (→ Backlog).
9. Stabilitäts-/Recovery-Tests: Abbruch zwischen Import, Activate, Execution, Approval und Drive-Archivierung.
   - Readback Comparison: generierter vs. importierter Workflow semantisch vergleichen (Nodes, Typen, Verbindungen) [BOSS-Entscheidung 2026-10-02, QA-Audit].
10. Security-Härtung: Auth, Session, CORS, CSRF, Tenant-/Owner-Trennung, Secret-Leaks, Webhook-Schutz, Dependency Audit.
11. Performance messen: End-to-End-Laufzeit, einzelne Phasen, API-Latenzen, n8n-Laufzeit und Archivierung.
12. Kostenmetriken Production-fähig machen: API-Kosten, Tokens, Modellaufrufe, Testanzahl, Retries, Repair-Loops, Gesamtkosten. Aktuell liefert der HTTP-Adapter die Produktionsmetriken noch nicht real.
13. Testmodus sauber abbilden: MOCK / DRY_RUN bzw. gewünschtes CHAOS / REAL konsistent in Backend, Vertrag und UI.
14. Fertige Workflow-Pakete strukturieren: jobId, Gewerk, Kategorie, Firma/Kunde, Version, FE-/BE-SHA, n8n-Execution eindeutig verknüpfen.
15. Filter-/Bibliotheksfunktion für fertige Workflows im UI umsetzen.
16. Observability verbessern: correlationId durch Backend, n8n, Drive, Logs und Evidence durchgängig persistieren.
17. Release-/Promotion-Governance technisch härten: Human-Gate soweit möglich zusätzlich technisch erzwingen, nicht nur prozessual.
18. Langzeit-/Soak-Tests durchführen und Grenzwerte dokumentieren.
   - Branch-/Depth-Werte großer Workflows messen und dokumentieren; Limits nur bei belegtem Bedarf [BOSS-Entscheidung 2026-10-02, QA-Audit].
19. Security-/Performance-Evidence-Pack für Hardening erstellen.
20. Erst danach Feature-Erweiterungen: n8n-Affiliate, Installer, Comic-/Erklärvideos, Design-V2-Integration.

## Backlog (nicht freigegeben, nach Punkt 20)
- Graph-Optimierung [BOSS-Entscheidung 2026-10-02, QA-Audit].

## Arbeitsreihenfolge ab Punkt 8 [BOSS-Entscheidung 2026-10-02]
Historische Monolith-Grenze (seit 2026-10-03, siehe Zielbild oben): Betriebsgrenze **40 Nodes** [BOSS-Entscheidung 2026-10-02, ersetzt die Grenze 50; gültig bis Abschluss H1–H6 des Hardening-Plans, danach Requalifizierung 60 (H7)]. Evidence: `OPERATING_LIMIT_40_NODES_2026-10-02.md`.
~~Betriebsgrenze **50 Nodes** [BOSS-Entscheidung 2026-10-02, ersetzt die vorläufige Grenze 60]. Begründung: 40 Nodes PASS, 60 Nodes Standardauftrag PASS, 60 Nodes mit Langprompt reproduzierbar FAIL (T1, Runs 36997147458 und 37000098816). 60 Nodes bleibt als historisch erfolgreich getestete Obergrenze dokumentiert. Stufen 80/100 sind nicht geplant.~~ (ersetzt)
1. T1 Langprompt (60 Nodes, ≈ 7 900 Zeichen) – erledigt: reproduzierbar FAIL, Grundlage der 50-Node-Grenze
2. T2 Prompt-Limit (> 8 000 Zeichen wird abgelehnt, kein Job)
3. R-20-QUALITY (Definition v1 unverändert)
4. 8b Graph-Integrität (Hardening)
5. Regression 40 = Betriebsgrenze (Werkzeug hat bisher keine Stufe 50; 60 nur als historische Referenz)
6. Punkt 9 Recovery
