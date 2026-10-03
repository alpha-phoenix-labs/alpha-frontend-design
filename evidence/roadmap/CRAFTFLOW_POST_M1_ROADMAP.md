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
