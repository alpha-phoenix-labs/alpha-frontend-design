# R-04a – Backend-Testjobs / DB: Baseline (read-only, ENTWURF)

Stand: 2026-09-30 · Roadmap Punkt 4/20 · Human Gate: keine DB-Verbindung aufgebaut, keine Änderung

## Datenmodell (BE `prisma/schema.prisma`, main 60da25e)
- `WorkflowJob` (id cuid, clientRequestId unique, prompt, status JobStatus, version, inFlightStep/-Since, graphState, testReport, costUsd, totalTokens, costUnknown, errorMessage, archiveStatus, archiveReport, approvedBy, approvedAt, createdAt, updatedAt)
- `User` (id, email unique, password, role default OWNER) · `BootstrapLock` (id, createdAt)
- Migrationen: `20260924000000_init`, `20260928110000_add_client_request_id`
- Kein Feld für correlationId, Testmarker, Besitzer/Tenant.
- Schreibpfade: create (`app/api/orchestrator/route.ts:112`), updateMany (store.ts, drive-store.ts, approve/route.ts). **Kein Löschpfad** im Code.

## Datenbank (Render, Workspace ventomlabs `tea-da5lqvuk1f9s73918ul0`)
- `handwerkflows-test-db` · `dpg-daqvof3ncjis73bj3t0g-a` · PostgreSQL 18 · Frankfurt · **plan free** · status available
- **expiresAt 2026-10-25T04:44:44Z** (Free-Plan-Ablauf) → PRODUKTIONSRISIKO, sofern das Backend diese DB nutzt (Dossier §8.3: ja; DATABASE_URL selbst NICHT GEPRÜFT, Secret)
- ipAllowList leer → Render-MCP-Query abgewiesen („blocks all external connections“). Zählungen NICHT MÖGLICH ohne Allowlist-Änderung (= Rechte-/Security-Änderung, Human Gate; laut Render mit gehostetem MCP ohnehin nicht nutzbar).

## Bekannte Test-jobIds (aus Drive-/n8n-Evidence, 29)
- 21 mit Drive-Artefakten (R-03a): 13 Standard-E2E, 1 synthetisch, 2 manuell (UNKLAR), 5 Evidence-Anker
- 8 nur in n8n (R-02d Kat. C): cmuk0jjj2…, cmuk0wgwc…, cmukh4sz1…, cmul2gk3i…, cmuloyms9…, cmuls94u0…, cmult0gal…, cmuluxjai…
- Weitere Jobs aus fehlgeschlagenen E2E-Läufen (ohne n8n-Import) wahrscheinlich; Anzahl NICHT GEPRÜFT.

## Nebenbefund (für Punkt 10)
- `alpha-final-master-db` und `alpha-creator-sandbox-db`: ipAllowList `0.0.0.0/0` („everywhere“ / „Temporary ChatGPT DB diagnostic“), beide suspended. Nicht Craftflow-Kern.

## Entscheidungsvorlage 4b
- (A) Einmalige Bereinigung: Zugriff ermöglichen (temporäre Allowlist-IP oder Render-Shell durch BOSS), Dry-run-Zählung, Export der Testzeilen ohne PII, transaktionales DELETE mit Zeilenlimit, Nachzählung.
- (B) Nur Cleanup-Pfad definieren (Umsetzung in Punkt 5: Testmarker/correlationId-Feld + allowlist-basiertes Löschen), Altbestand bleibt bis dahin.
- Empfehlung: zuerst DB-Ablauf 25.10. klären; danach (B), da Altbestand ohne Testmarker nicht sicher trennbar ist.
