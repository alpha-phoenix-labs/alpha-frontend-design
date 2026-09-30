# R-03c – Cleanup-Regel für Drive-Artefakte künftiger E2E-Läufe (ENTWURF zur BOSS-Freigabe)

Stand: 2026-09-30 · Roadmap Punkt 3/20 · Umsetzung im Code erst in Punkt 5 (Cleanup) / 16 (correlationId) – dieses Dokument ist nur die Regel.

## Ist-Zustand (belegt)
- Jeder erfolgreiche E2E-Lauf (Real E2E, Post-Deploy Production Gate) schreibt 5 Dateien in die **Produktiv-Ordner** 01-AUFTRAEGE, 02-WORKFLOWS, 03-TEST und 2× 04-FERTIG (BE `lib/integrations/drive-api.ts:110-132`).
- Metadaten nur `appProperties.hfJobId` + `hfKind` (`drive-api.ts:98`); keine correlationId, kein Testmarker.
- Folge: 04-FERTIG enthält heute ausschließlich Testergebnisse (42 Dateien, R-03a) – Konflikt mit Regel „04-FERTIG = Endergebnisse, nicht anfassen“.

## Regel (Vorschlag)
1. **Trennung:** E2E-/Testläufe schreiben NICHT in die Produktiv-Ordner, sondern in einen eigenen Test-Ordnersatz `N8N-AGENT_SWARM-TEST/01…04` (eigene Folder-IDs per Env, nur im Testmodus gesetzt). Fehlen die Test-Folder-IDs im Testmodus → Drive-Stufe BLOCKED (fail-closed), kein Fallback auf Produktiv-Ordner.
2. **Pflichtmetadaten** (appProperties) je Testdatei: `hfJobId`, `hfKind`, `hfTest=true`, `hfCorrelationId`, `hfRunId` (GitHub-Run-ID). Datei ohne diese Felder gilt nie als Testartefakt.
3. **Löschzeitpunkt:** am Ende jedes E2E-Laufs, nachdem Evidence (result.json/Artefakt) geschrieben ist; Löschen = Papierkorb, nur Dateien mit `hfTest=true` UND passender `hfCorrelationId` des laufenden Laufs (Allowlist), Obergrenze 5 Dateien pro Lauf.
4. **Aufbewahrung / Ausnahme Evidence:** Läufe, die in Release-/Freeze-Evidence referenziert werden, werden NICHT automatisch gelöscht; sie werden als `hfEvidenceAnchor=true` markiert und frühestens 30 Tage nach dem nächsten Freeze nach BOSS-GO entfernt.
5. **Fehlerverhalten:** Cleanup-Fehler → eigener Status `CLEANUP_INCOMPLETE` im Evidence-Ergebnis, niemals PASS; max. 3 Versuche; Guard-Abbruch (`CLEANUP_SKIPPED_GUARD`) bei fehlendem Marker, fremder correlationId oder Überschreitung der Obergrenze. Test bleibt fachlich PASS/NOT_PASS, Cleanup-Status wird separat berichtet.
6. **Verantwortung:** automatisch durch die E2E-Pipeline (nach Umsetzung Punkt 5); Altbestände nur manuell nach Inventar → Dry-run → BOSS-GO → Batch → Nachinventar (R-03b); Ausnahmen entscheidet der BOSS.
7. **04-FERTIG:** Produktiv-04-FERTIG erhält nur echte, vom BOSS freigegebene Endergebnisse. Bestehende 42 Testdateien darin: Entscheidung BOSS (Ausnahme zur Löschung oder Verbleib).

## Konsistenz mit Punkt 5 (Abschnitt 5.4 Agentenanweisung)
Allowlist statt Blocklist ✓ · nur im Testlauf-Kontext ✓ · Hard-Guards (Marker, correlationId, Limit) ✓ · CLEANUP_INCOMPLETE statt PASS ✓ · idempotent (Papierkorb-Query nach hfCorrelationId) ✓ · Deaktivieren/Verschieben allein zählt nicht als Cleanup ✓
