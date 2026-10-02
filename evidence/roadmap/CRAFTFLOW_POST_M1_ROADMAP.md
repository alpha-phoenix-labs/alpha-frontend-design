# CRAFTFLOW / HANDWERKERFLOW – Post-M1-Roadmap, Priorität 1–20

Quelle: BOSS-Vorgabe „CRAFTFLOW_POST_M1_ROADMAP_1-20“ (Wortlaut der Punkte 1–20 unverändert; Kopfzeilen weggelassen).
Änderungen nur per BOSS-Entscheidung; jede Ergänzung ist datiert und mit [BOSS-Entscheidung …] gekennzeichnet.

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
Betriebsgrenze 60 Nodes (Stufen 80/100 nicht geplant).
1. T1 Langprompt (60 Nodes, ≈ 7 900 Zeichen)
2. T2 Prompt-Limit (> 8 000 Zeichen wird abgelehnt, kein Job)
3. R-20-QUALITY (Definition v1 unverändert)
4. 8b Graph-Integrität (Hardening)
5. Regression 40/60
6. Punkt 9 Recovery
