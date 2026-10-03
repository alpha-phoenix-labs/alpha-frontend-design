# CRAFTFLOW Architektur-Spezifikation – Modulare 20-Node-Produktfabrik

Version: 1.0
Status: **Architektur-Gate 1 freigegeben** (BOSS-Entscheidung 2026-10-03, „GO ARCHITEKTUR-PR“); Umsetzung je Gate (§20) mit eigener Freigabe.
Quelle: BOSS-Vorlage „CRAFTFLOW ARCHITEKTUR-SPEZIFIKATION – MODULARE 20-NODE-PRODUKTFABRIK“, Version 1.0 (Wortlaut der Abschnitte 1–20 übernommen, nur in Markdown gesetzt).
Kennzeichnung: BELEGT · ANNAHME · NICHT GEPRÜFT

## BOSS-Entscheidungen zu Gate 1 (2026-10-03)

1. **Modul B im Prototyp**
   - Kein echter LLM-Aufruf.
   - Fixture mit definierter Structured-Output-Antwort und dokumentiertem Fallback.
   - Kein neuer Credential-Slot in Gate 1; ein echter LLM-Slot folgt später als separates Validator-Gate.
   - Hintergrund (BELEGT, Backend `5b1b15d`): Der Validator verbietet heute HTTP-Authentifizierung und Secret-Header (`lib/orchestrator/node-schemas.ts`, `HTTP_AUTH_NOT_ALLOWED`, `SECRET_HEADER_NOT_ALLOWED`); der Credential-Slot-Vertrag kennt nur `CRED_SLOT_HTTP_WEBHOOK_AUTH`.
2. **Legacy-Archivierung**
   - In Gate 1 nur dokumentarisch als Legacy markieren.
   - Keine Änderung in n8n: keine Deaktivierung, Migration oder Löschung.
   - Die tatsächliche Archivierung erhält später ein eigenes Human Gate.
3. **H1**
   - Die monolithische H1-Reparaturschleife ist gestoppt.
   - Status: „durch Architekturentscheidung ersetzt, historisch FAIL“ (Evidence `evidence/roadmap/R20_QUALITY_EVIDENCE.md`).
   - `PARAMETER_NOT_ALLOWED:HTTPREQUEST` und der `ALLOWED_HOSTS`-Befund (`REPEATED_REJECTED_DESTINATION`) bleiben bekannte Legacy-Befunde.
   - Keine weitere H1-Ausführung vor dem modularen Prototyp; neuer Qualitätsnachweis ist der modulare Prototyp bis n8n-Readback.
   - H7 (60-Node-Requalifizierung) ist ebenfalls durch den modularen Pfad ersetzt.

## QA-Reports (Stand 2026-10-03)

Laut BOSS vorhanden, aber noch nicht versioniert; in dieser Umgebung nicht auffindbar (NICHT GEPRÜFT):
- `audit/2026-10-03-audit-09-tatsaechliche-workflow-nodezahl.md`
- `audit/2026-10-03-audit-10-h1-builder-blocker.md`
- `audit/2026-10-03-audit-11-20-node-modulararchitektur-legacy.md`

Die Reports werden in einem separaten Evidence-PR gesichert. Inhalte werden weder erfunden noch rekonstruiert.

---

## Ziel

Craftflow erzeugt keine neuen monolithischen Großworkflows.

Künftig gilt:
- maximal 20 fachliche Nodes je Modul
- Module sind eigenständige n8n-Sub-Workflows
- größere Produkte bestehen aus mehreren Modulen
- ein kleiner Parent orchestriert die Module
- Module werden einzeln importiert, geprüft, versioniert und ersetzt
- keine künstliche Auffüllung auf exakt 20 Nodes
- keine leeren Platzhalter-Nodes

## 1. Architekturgrundsatz

Zielstruktur:

Auftrag → ARCHITECT erstellt Modulplan → BUILDER erzeugt Module einzeln → Validator prüft jedes Modul → TESTER importiert Module → Workflow-IDs werden erfasst → Parent wird deterministisch gebaut → Parent wird importiert → Readback prüft Parent und Module

Große Abläufe entstehen nicht durch Zusammenkopieren aller Nodes. Stattdessen:

Parent → Execute Sub-Workflow Modul A → Execute Sub-Workflow Modul B → Execute Sub-Workflow Modul C → Gesamtergebnis

## 2. Verbindliche Grenzen

Modul:
- maximal 20 fachliche Nodes
- genau ein Sub-Workflow-Trigger
- keine Webhook- oder Manual-Trigger innerhalb eines aufgerufenen Moduls
- keine leeren Set-Nodes
- keine Dummy-Nodes
- keine ungenutzten Verbindungen
- keine Rückverbindung zum Trigger
- keine eingebetteten Workflow-IDs vor dem Import

Parent:
- maximal 7 fachliche Nodes im ersten Prototyp
- genau ein externer Trigger
- keine Geschäftslogik, die in ein Modul gehört
- nur Routing, Modulaufrufe, Übergaben, Fehlersteuerung und Ergebnis

Node-Zählregel:
- Trigger zählt als Node
- Error- und Fallback-Nodes zählen als Nodes
- Execute-Sub-Workflow-Nodes zählen im Parent
- Test-Evidence-Nodes zählen nicht zur fachlichen Modulgrenze
- Test-Evidence-Nodes müssen im Readback separat ausgewiesen werden

## 3. Modulvertrag

Jedes Modul besitzt: moduleId, moduleType, version, name, description, nodeCount, inputSchema, outputSchema, workflowId, workflowHash, status, credentialRequirements, allowedHosts, timeoutPolicy, retryPolicy, onAbort, errorCodes, evidence, compatibilityVersion.

Pflichtregeln:
- moduleId bleibt über Versionen stabil
- version folgt semantischer Versionierung
- workflowId wird erst nach erfolgreichem Import eingetragen
- Eingaben und Ausgaben sind strikt typisiert
- freie Routing-Texte sind verboten
- Enums werden zentral definiert
- Credentials werden nur referenziert, nie exportiert
- Secrets dürfen nicht im Workflow-JSON stehen

## 4. Standard-Datenmodell

Lead:
- customer: name, phone, email, preferredContact
- location: street, postalCode, city, country, latitude, longitude
- project: trade, description, urgency, category, requestedDate
- metadata: jobId, correlationId, source, receivedAt, consent, schemaVersion

Verbindliche Enums:
- project.urgency: emergency, urgent, standard
- status: accepted, rejected, failed, blocked, completed

Alle Enum-Werte werden technisch validiert.

## 5. Modul A – Ingestion und Validation

Zweck: Rohe Eingangsdaten annehmen, prüfen und normalisieren.

Input: Webhook-Payload des Parents, jobId, correlationId

Aufgaben:
- Pflichtfelder prüfen
- Datentypen prüfen
- Telefonnummer normalisieren
- E-Mail normalisieren
- Standortdaten normalisieren
- Spam- und Autorisierungsstatus übernehmen
- ungültige Payload ablehnen
- standardisiertes Lead-Objekt ausgeben

Output: normalizedLead, validationStatus, validationErrors, jobId, correlationId

Nicht zulässig: LLM-Aufruf, Routing zu Handwerkern, WhatsApp-Versand, Datenbankauswahl

## 6. Modul B – Enrichment und KI-Processing

Zweck: Validierte Eingangsdaten fachlich anreichern.

Input: normalizedLead, jobId, correlationId

Aufgaben:
- Projektbeschreibung klassifizieren
- Gewerk bestimmen
- Dringlichkeit bestimmen
- Kategorie bestimmen
- strukturierte Ausgabe erzwingen
- LLM-Fehler abfangen
- definierte Fallback-Werte liefern
- Standortdaten für Routing vorbereiten

Output: enrichedLead, classificationStatus, fallbackUsed, jobId, correlationId

Regeln:
- LLM-Ausgabe ausschließlich strukturiert
- keine freien Routing-Texte
- maximal ein kontrollierter Retry
- zweiter Fehler endet fail-closed
- Tokens und Kosten werden kumuliert
- keine Kundendaten in Diagnose-Logs

Gate-1-Entscheidung: Im Prototyp ersetzt eine Fixture mit definierter Structured-Output-Antwort und dokumentiertem Fallback den LLM-Aufruf (siehe oben).

## 7. Modul C – Routing und Execution

Zweck: Angereicherte Leads anhand definierter Regeln weiterleiten.

Input: enrichedLead, jobId, correlationId

Aufgaben:
- Routing nach Gewerk
- Routing nach Dringlichkeit
- Radius- oder Verfügbarkeitsprüfung
- Auswahl geeigneter Empfänger
- vorbereitete Nachricht erzeugen
- externen Versand auslösen
- Versandfehler eindeutig erfassen

Output: routingResult, selectedRecipients, deliveryStatus, jobId, correlationId

Regeln:
- Routing nur über Enums
- keine freie Interpretationslogik
- externe Hosts müssen in allowedHosts stehen
- Credential-Verträge müssen vor Import bestehen
- externe API-Fehler benötigen Fallback oder klaren Abbruch

Modul C ist nicht Bestandteil des ersten Prototyps.

## 8. Parent-Orchestrator

Der Parent enthält ausschließlich:
1. externen Trigger
2. minimale Sicherheit und Korrelations-ID
3. Aufruf Modul A
4. Prüfung Modul-A-Ergebnis
5. Aufruf Modul B
6. Prüfung Modul-B-Ergebnis
7. Gesamtergebnis

Der Parent wird nicht frei vom LLM erzeugt, sondern deterministisch aus dem Modulplan gebaut.

Importreihenfolge:
1. Modul A importieren
2. Modul-A-Workflow-ID erfassen
3. Modul B importieren
4. Modul-B-Workflow-ID erfassen
5. Workflow-IDs in Parent einsetzen
6. Parent importieren
7. Parent und Module zurücklesen

## 9. BUILDER-Verhalten

Der BUILDER erzeugt immer nur ein Objekt gleichzeitig: ein Modul oder den Parent.

Nie gleichzeitig:
- mehrere vollständige Module in einer Antwort
- Parent plus alle Module in einem JSON
- einen monolithischen Gesamtworkflow

Für jedes Modul:
1. Vertrag laden
2. Nodes erzeugen
3. Verbindungen aufbauen
4. IDs reparieren
5. Graph validieren
6. Node-Schema validieren
7. Credential-Vertrag prüfen
8. Host-Policy prüfen
9. Modul-JSON ausgeben

## 10. Validator-Erweiterung

Neu zulässige Node-Typen: Execute Sub-Workflow, Execute Sub-Workflow Trigger.

Trigger-Regeln:
- Parent: genau ein Webhook- oder Manual-Trigger
- Modul: genau ein Execute-Sub-Workflow-Trigger, kein Webhook, kein Manual-Trigger

Graph-Regeln:
- alle Nodes erreichbar
- keine isolierten Nodes
- keine doppelten Verbindungen
- keine Verbindung zurück zum Trigger
- keine nicht vorhandenen Ziele
- keine leeren Ausgangsreferenzen
- Parent-Workflow-IDs müssen auf importierte Module zeigen

Ist-Stand (BELEGT, Backend `5b1b15d`): erlaubt sind nur `manualTrigger`, `webhook`, `set`, `httpRequest`, `if`, `stopAndError` und `errorTrigger` (`lib/orchestrator/node-schemas.ts`). `validateWorkflow` kennt nur die Arten `main` und `error` (`REQUIRE_SINGLE_TRIGGER`, `lib/orchestrator/core.ts`).

## 11. Fehlerarchitektur

Jedes Modul liefert ein standardisiertes Ergebnis: status, moduleId, version, errorCode, errorStage, retryable, fallbackUsed, output, jobId, correlationId.

Fehlerregeln:
- kein stilles Sterben
- keine Endlosschleifen
- maximal ein definierter Retry je kritischem Schritt
- zweiter Fehler endet eindeutig
- Fehler eines Moduls darf nicht als Gesamt-PASS gewertet werden
- Parent muss das fehlerhafte Modul benennen

## 12. TESTER und Import

Der TESTER verarbeitet mehrere Workflow-Objekte je Job.

Neue Job-Struktur: modulePlan, modules[], parentWorkflow, importedModules[], importedParent, moduleExecutions[], evidence

Pflichtprüfung je Modul:
- Generated Node Count
- FINAL Node Count
- Readback Node Count
- Workflow-ID
- Workflow-Hash
- Referenzkonsistenz
- Credential-Vertrag
- Allowed-Hosts-Vertrag
- Graph-Integrität

Pflichtprüfung Parent:
- referenzierte Modul-IDs existieren
- Workflow-IDs stimmen
- Modulreihenfolge stimmt
- Datenübergaben entsprechen den Schemas
- Fehlerstatus werden korrekt weitergegeben

## 13. Evidence-Struktur

Evidence je Modul: moduleId, version, generatedWorkflow, finalWorkflow, readbackWorkflow, workflowId, workflowHash, nodeCount, connectionCount, validationResult, credentialManifest, allowedHostsManifest

Evidence Gesamtauftrag: jobId, correlationId, modulePlan, Parent-Workflow-ID, Modul-Workflow-IDs, FE-SHA, BE-SHA, Runtime Truth, Importreihenfolge, Endstatus

## 14. Produktmodelle

Standalone-Kit:
- Kunde erhält versionierte JSON-Dateien
- Kunde importiert Parent und Module selbst
- Updates werden als neue Produktversion ausgeliefert
- zentrale Änderung aktualisiert bestehende Kundeninstallationen nicht automatisch

Managed-Modell:
- Module liegen in einer kontrollierten n8n-Instanz
- Parent verweist auf zentral verwaltete Workflow-IDs
- Modulupdates können zentral ausgerollt werden
- benötigt Betriebs-, Hosting- und Mandantentrennung

Für den ersten Produktprototyp gilt: Standalone-Kit.

## 15. Legacy- und Löschregeln

Bis zur erfolgreichen Prototyp-Abnahme:
- keine bestehenden Workflows löschen
- Löschstopp bleibt aktiv
- bestehende Großworkflows nur archivieren (Gate-1-Entscheidung: nur dokumentarisch als Legacy markieren, keine Änderung in n8n; die tatsächliche Archivierung erhält ein eigenes Human Gate)
- Runtime-Truth-Verweise nicht verändern
- Credentials nicht verändern
- keine alte Workflow-ID überschreiben

Erst nach Abnahme:
- Legacy neu inventarisieren
- Referenzen prüfen
- exportieren und hashen
- SAFE_DELETE bestimmen
- nummerierten Löschbatch vorlegen

Löschung nur mit: `GO DELETE BATCH <BATCH-NR>`

## 16. Prototyp-Scope

Der erste Prototyp enthält:
- Parent mit maximal 7 Nodes
- Modul A mit maximal 20 fachlichen Nodes
- Modul B mit maximal 20 fachlichen Nodes
- feste Verträge
- getrennte Workflow-IDs
- Import und Readback
- keine Platzhalter
- keine Lemon-Squeezy-Logik
- kein Modul C
- keine produktiven Credentials
- keine Legacy-Löschung

## 17. Definition of Done

Der Prototyp ist DONE, wenn:
1. Modul A importiert und zurückgelesen wurde.
2. Modul B importiert und zurückgelesen wurde.
3. Beide Module maximal 20 fachliche Nodes besitzen.
4. Keine Node leer oder rein dekorativ ist.
5. Parent beide Module über deren Workflow-IDs aufruft.
6. Input-/Output-Verträge technisch geprüft werden.
7. Generated, FINAL und Readback je Workflow korrelieren.
8. Fehler eindeutig Modul A oder B zugeordnet werden.
9. Parent und Module getrennt rollbackfähig sind.
10. Keine Legacy-ID versehentlich referenziert wird.
11. Evidence vollständig vorliegt.
12. QA ein unabhängiges GO erteilt.

## 18. Umsetzungsreihenfolge

- Phase 0: QA-Reports sichern; Architekturentscheidung dokumentieren
- Phase 1: Modulvertrag und Datenmodell implementieren; neue Node-Typen im Validator erlauben; modulabhängige Trigger-Regeln implementieren
- Phase 2: Job-Datenmodell auf mehrere Workflows erweitern; Modulimport und Workflow-ID-Auflösung implementieren; Parent deterministisch erzeugen
- Phase 3: Modul A bauen, importieren, Readback prüfen
- Phase 4: Modul B bauen, importieren, Readback prüfen
- Phase 5: Parent bauen, Modul-IDs einsetzen, importieren, Readback prüfen
- Phase 6: QA-Audit, Evidence, GO/NO-GO

## 19. Nicht im Scope

Modul C; WhatsApp-Produktivversand; produktive Datenbankabfragen; Lemon-Squeezy-Vertrieb; Affiliate-Logik; Upselling; automatische Updates bei Kunden; Mandantentrennung; Legacy-Löschung; Performance-Hardening; neue Großworkflow-Tests; Modellwechsel.

## 20. Human Gates

Eigene Freigabe erforderlich für:
1. Architektur-PR (dieses Dokument; freigegeben 2026-10-03)
2. Validator-Erweiterung
3. Job-Datenmodell
4. Importlogik
5. Modul A
6. Modul B
7. Parent-Orchestrator
8. erster kostenpflichtiger Prototyplauf
9. QA-Abnahme
10. jede Legacy-Löschrunde

Keine Umsetzung oder Zusammenlegung mehrerer Gates ohne explizite Freigabe.
