# Audit 08: R-06 Post-Merge-Truth – Nachprüfung auf aktuellem `main`

- Datum: 2026-10-01
- Prüfer: Alpha-QA
- Geprüfter Stand: FE `aa7495d58a24d42fa14324f107a38078f73db6fa` · BE `1a1bce3d31c033078aab318225daf02e8b2bb537` · Render LIVE `1a1bce3d31c033078aab318225daf02e8b2bb537` (`dep-dav80ptg1s2s73dgkotg`) · CF-Version `6f31814a-45e0-4161-ae49-50ce5b514327`
- Auftrag: Mensch/Chef, 2026-10-01 („Neu-Audit auf aktuellem Stand, Umfang wie Audit 07 plus Schließung B1/B2/H1 und H2“)
- Bezug: Audit 07 (`2026-09-30-audit-07-r06-post-merge-truth.md`, Stand FE `2a6760d` / BE `6835adb`, STATUS BLOCKIERT)

Kennzeichnung: BELEGT = selbst geprüft · ANNAHME · NICHT GEPRÜFT

## 1. Methode

Wie in Audit 07: Die SHAs habe ich live per `git ls-remote` gelesen, GitHub-Runs, -Jobs und -Logs über die API, die Rulesets unauthentifiziert über die REST-API und Render über die Render-API. Code und Tests habe ich in sauberen `git archive`-Kopien beider `main`-SHAs mit Node v22.22.2 geprüft. Ich habe keine Re-Runs, kein `workflow_dispatch`, keinen E2E und keine Löschung ausgelöst. Der lesende Zugriff auf das BE-Repo ist vom Menschen am 2026-10-01 freigegeben.

Umfang: R-06 (Fehlerfälle, Post-Merge-Truth). Fachinhalte von R-07/R-08 (Last- und Großworkflow-Tests) sind **nicht** auditiert.

## 2. Ergebnisse

### 2.1 SHAs (BELEGT)
- FE `main` = `aa7495d…` (15 Commits nach `2a6760d`), BE `main` = `1a1bce3…` (9 Commits nach `6835adb`).
- `config/backend-runtime-truth.json` pinnt `1a1bce3…` / `srv-daqk0sp7lnhs73d9nr7g`.

### 2.2 Pre-Merge (BELEGT)
- FE#54 (letzter Merge): `build`, `deploy-test`, `design-sandbox-guard` und `real-e2e-contract` sind success, `real-e2e` ist skipped (PR, erwartet).
- BE#49 (letzter Merge): `verify` success (Run 36886575726).
- Rulesets unverändert zurückgelesen: FE 23705450 `active`, strict, required `build`/`deploy-test`/`design-sandbox-guard`; BE 23936816 `active`, strict, required `verify`. `bypass_actors: []` habe ich nur unauthentifiziert gelesen, die Vollständigkeit ist eine ANNAHME (wie Audit 07).

### 2.3 Post-Merge FE (BELEGT, alle `event=push`, `head_sha=aa7495d…`, Attempt 1)
| Workflow / Job | Run-ID | Job-ID | Ergebnis |
|---|---|---|---|
| `ci.yml` / `build` | 36887407055 | 110454125404 | success |
| `cloudflare-deploy-test.yml` / `deploy-test` | 36887406854 | 110454123882 | success (Upload ohne Traffic) |
| `real-e2e.yml` / `real-e2e` | 36887407163 | 110454127590 | success |
| `real-e2e.yml` / `real-e2e-contract` | 36887407163 | 110454129984 | skipped (erlaubt) |

Real-E2E-Log (Job 110454127590), Vorschau `https://763db698-alpha-frontend-design.vantaria-labs.workers.dev`:
```
jobId cmuppoutj0000s1r272lexnxi · WAITING_FOR_APPROVAL · approvalVersion 11
n8n {pass:true, executionId:"68", importedId:"GduZynwwTKy7pqTX"} · completed:true
drive {status:"COMPLETE", 5 IDs, persistedReportMatches:true}
runtimeTruth {status:200, expected == actual == {n8n-workflow-factory, main,
  1a1bce3d31c033078aab318225daf02e8b2bb537, srv-daqk0sp7lnhs73d9nr7g}, matches:true}
REAL_E2E_PASS
cleanup {status:"CLEANUP_OK", n8n DELETED, Drive 5× TRASHED}
```

### 2.4 Promotion (BELEGT)
- `production-promotion.yml` Run 36887598173, Job `promote` 110454782096 success → `wrangler deploy`, `Current Version ID: 6f31814a-45e0-4161-ae49-50ce5b514327`, `control.vantarialabs.tech`.
- `post-deploy-production-gate.yml` Run 36887679832, Job `production-gate` 110455049955 success:
  - CF vor/nach `6f31814a…`, `stable:true`, Preflight PASS
  - Produktions-E2E Job `cmupprfjb0001s1r2vrgoqafd` (n8n-Execution 69, Drive COMPLETE)
  - **`runtimeTruth.matches:true`**, **`cleanup CLEANUP_OK`**
  - `POST_DEPLOY_PRODUCTION_E2E=PASS`, Artifact 11174809742
- Die Läufe 36888742984 / 36888750745 (`skipped`, 16:00Z) entstanden durch den PR-Lauf von PR #55. Ein Skip ist dort korrekt.

### 2.5 Post-Merge BE (BELEGT)
- `handwerkflows-verify.yml` Run 36886777817 (`push`, `main`, `1a1bce3…`) success.
- Render `srv-daqk0sp7lnhs73d9nr7g`: `dep-dav80ptg1s2s73dgkotg`, Commit `1a1bce3…`, `status=live`, fertig 2026-10-01T15:47:43Z. Das Real-E2E startete 15:51:20Z, also danach. Unabhängig davon belegt der Runtime-Truth-Match in 2.3 den LIVE-Commit.

### 2.6 Runtime-Pin (PASS, B1 geschlossen)
- `scripts/real-business-e2e.mjs` Z. 29-30 liest den Pin, Z. 171-191 ruft `/api/runtime-truth` mit OWNER-Session auf. Bei Status ≠ 200 → `BUSINESS_E2E_RUNTIME_TRUTH_UNAVAILABLE`, bei Abweichung eines der 4 Felder → `BUSINESS_E2E_RUNTIME_TRUTH_MISMATCH`. `fail()` wirft (Z. 72), der Top-Level-`catch` setzt `process.exitCode = 1`, und `REAL_E2E_PASS` wird nicht ausgegeben.
- Die Prüfung läuft **vor** dem Anlegen eines Jobs. Das erzwingt der Governance-Test `R-06 business E2E binds to the pinned backend runtime before creating a job` (`real-e2e-governance.test.mjs:138-149`).
- Das Post-Deploy-Gate nutzt dasselbe Skript und ist damit ebenfalls gebunden (Beleg 2.4).

### 2.7 Fachlich R-06
- FE: 403/429/HTML/Kürzung unverändert wie in Audit 07. **H1 geschlossen:** JSON-`{error}` läuft jetzt über `truncated()` (`HttpFactoryService.ts`).
- BE: OpenAI-Retry unverändert (2 Versuche, nur 429/503). **H2 weitgehend geschlossen** (BE#41 `cecc5cb`): Die Regex `PUBLIC_ERROR_CODE` erlaubt nach dem Code nur noch `key=value`-Paare. Lokal geprüft:
  - `"ECONNREFUSED 10.0.0.5:5432"` → `INTERNAL_ERROR`
  - `"P1001 Can't reach … :5432"` → `INTERNAL_ERROR`
  - Restrisiko gering: Beliebige `key="…"`-Werte gehen weiter durch, z. B. `message="…"`. So ist es für bereinigten Anbietertext gewollt (`sanitizeEvidenceText`).
- **B2-Ursache:** BE#41 liest nach verlorener Trash-Antwort die Datei zurück (`drive-api.ts`, `confirmTrashedAfterLostResponse`, `DRIVE_TRASH_CONFIRMED_BY_READBACK`). Drive-Transportfehler werden als `DRIVE_<GET|TRASH>_<TIMEOUT|NETWORK>` klassifiziert. Code und Tests sind BELEGT, ein Live-Fehlerfall ist NICHT GEPRÜFT.
- **B2-Altfall:** Der Eintrag steht im LOESCHPROTOKOLL (Z. 67) als „ERLEDIGT (ANNAHME)“. Der Verbleib der 2 Dateien ist weiterhin nicht belegbar, weil der Connector keinen Zugriff hat.

Lokale Ausführung (saubere Kopien, Node v22.22.2):
| Befehl | Exit | Ergebnis |
|---|---|---|
| FE `npm ci` / `typecheck` / `test` / `build` | 0 / 0 / 0 / 0 | 9 Dateien, 137/137 |
| FE `node --test scripts/*.test.mjs` | 0 | 72/72 |
| BE `npm ci --ignore-scripts` / `npm run test` | 0 / 0 | 157 + 20 + 6 + 7 = 190/190 |

### 2.8 Negativpfade (CF-PM-001 Nr. 7)
- Entfernter Trigger, Skip/Fail, veraltete Evidence oder anderer SHA, fehlender Run: wie in Audit 07, Promotion-Gate-Tests grün (Teil von 72/72).
- Falsche Backend-Runtime oder nicht erreichbares `/api/runtime-truth`: Der Fail-Pfad ist im Code belegt (2.6) und wird statisch durch den Governance-Test erzwungen. **Ein ausgeführter Negativlauf** (z. B. absichtlich falscher Pin) **existiert nicht** → NOT PROVEN. Die alten Negativskripte `real-e2e-*-negative.mjs` zielen weiter auf das nicht verdrahtete `real-e2e-smoke.mjs`.
- Fehlende Credentials: Die Steps „Require approved browser credentials“ / „Require runtime credentials“ sind im Lauf vorhanden, `MISSING_REQUIRED_ENV` steht im Skript.

## 3. Klassifikation (CF-PM-001 Nr. 8)

| Prüfpunkt | PASS | FAIL | UNKNOWN / INSUFFICIENT EVIDENCE | NOT PROVEN | NOT AUDITED — TIME LIMIT |
|---|---|---|---|---|---|
| 1 SHAs live | X | | | | |
| 2 Pre-Merge-Checks | X | | | | |
| 2 Ruleset-Durchsetzung | X | | bypass_actors nur unauthentifiziert | | |
| 3 FE build / deploy-test / real-e2e (push) | X | | | | |
| 3 Geschäftsablauf bis Drive COMPLETE + 5 IDs | X | | | | |
| 3 `evidence.cleanup = CLEANUP_OK` | X | | | | |
| 4 Promotion + Post-Deploy-Gate, CF-Version | X | | | | |
| 5 BE verify (push), Render LIVE = Pin | X | | | | |
| 6 Runtime-Pin im Real-E2E | X | | | | |
| 7 Code/Tests R-06, lokale Läufe | X (H2-Rest gering) | | | | |
| 8 Negativpfade (Trigger, Skip/Fail, Stale, Credentials) | X | | | | |
| 8 Negativpfad Runtime-Mismatch, ausgeführt | | | | X (nur Code und statischer Test) | |
| B2-Altfall: Verbleib 2 Drive-Dateien | | | X | | |
| DB `cleanupStatus` | | | X (kein DB-Zugriff) | | |
| Inhalte R-07 / R-08 | | | | | nicht beauftragt |

## 4. META-AUDIT (CF-PM-001 Nr. 10)

- **Kann eine falsche oder veraltete Backend-Runtime trotzdem PASS ergeben?** Nein. Laut Code und Governance-Test endet ein Mismatch vor der Joberstellung ohne `REAL_E2E_PASS`. Der Live-Lauf zeigt den Match. Die Lücke aus Audit 07 (B1) ist geschlossen.
- Können ausgelassene `build`, `deploy-test` oder `real-e2e` für den Promotion-SHA PASS ergeben? Nein (unverändert).
- **Offen, Entscheidung Chef/BOSS (nicht R-06-spezifisch):**
  - **G1 `paths-ignore`:** Unverändert (`evidence/**`, `release/**`). Commits, die nur Doku ändern, bleiben ohne sichtbares Ergebnis. `audit/**` ist nicht ausgenommen: Der Merge von PR #55 löst deshalb Real-E2E und Produktions-Deploy aus.
  - **G2 Backend-Deploy vor FE-E2E:** Ein Merge auf BE `main` geht per Render-Autodeploy sofort produktiv. Der Geschäfts-E2E gegen den neuen BE-SHA läuft erst mit dem FE-Pin-PR. Bis dahin läuft Produktion mit einem Backend, das nur `verify` hat (Beispiel R-06: BE live 19:32Z, FE-Pin 19:36Z). Ohne Pin-PR würde das erst beim nächsten FE-Push sichtbar, als Mismatch-Fehler. Für das geprüfte SHA-Paar ist das belegt geschlossen. Als Prozess ist es nicht automatisch erzwungen (CF-PM-001 Nr. 2/4).

## 5. Befunde an zuständige Rolle

- B1, B2 (Ursache) und H1 aus Audit 07: **geschlossen**. H2: weitgehend geschlossen (Restrisiko gering).
- **N1 → Alpha-Deploy:** Einen ausgeführten Negativtest für Runtime-Mismatch und nicht erreichbares `/api/runtime-truth` ergänzen, z. B. einen Unit-Test der Vergleichslogik oder einen Lauf gegen einen Stub. Die toten Negativskripte entfernen oder umhängen.
- **N2 → Chef/BOSS:** Entscheidung zu G1 (`audit/**` in `paths-ignore` plus sichtbarer Docs-only-Status) und G2 (BE-Merge erst nach FE-Pin-PR bzw. automatischer FE-E2E bei BE-Deploy).
- **N3 → Chef:** Admin-Rücklesen von `bypass_actors`. Doku-Drift aus Audit 07 (H3) besteht weiter.

## 6. Human-Gate-Bedarf

- Merge von PR #55 = Real-E2E plus Produktions-Deploy (G1). Nur mit GO des BOSS, Rollback-Basis CF `6f31814a-45e0-4161-ae49-50ce5b514327`.
- Entscheidungen G1/G2. Admin-Rücklesen der Bypass-Akteure.
- R-06-Abnahme (Definition of Done) liegt beim BOSS, `R-06_STATUS_FEHLERFAELLE_2026-10-01.md`: „WARTET AUF ABNAHME DURCH DEN BOSS“.

STATUS: FREIGEGEBEN — R-06 ist auf FE `aa7495d…` / BE `1a1bce3…` technisch abgeschlossen. Alle Post-Merge-Pflichtstufen sind PASS, der Runtime-Pin ist im E2E belegt und CLEANUP_OK ist erreicht. Diese Freigabe gilt nur für das genannte SHA-Paar. Sie ersetzt nicht die BOSS-Abnahme und nicht die offenen Prozessentscheidungen G1/G2, und der ausgeführte Mismatch-Negativtest (N1) ist NOT PROVEN.
