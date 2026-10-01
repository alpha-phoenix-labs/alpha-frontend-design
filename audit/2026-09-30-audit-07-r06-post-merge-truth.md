# Audit 07: R-06 Post-Merge-Truth (Fehlerfall-Härtung FE#39 / BE#40)

- Datum: 2026-09-30
- Prüfer: Alpha-QA
- Geprüfter Stand: FE `2a6760df18ce1af7de5851c9dd2ccdea5378d87d` · BE `6835adb116c31e87cf45bfcfee51b883b0cef35e` · Render LIVE `6835adb116c31e87cf45bfcfee51b883b0cef35e` (`dep-daum6su417fc73fe5b2g`) · CF-Version `dba1534a-bbff-4dbe-a551-1463a7078f13`
- Auftrag: Chef, Startprompt Alpha-QA „Erster Auftrag: Audit R-06 (Post-Merge-Truth)“

Kennzeichnung: BELEGT = selbst geprüft · ANNAHME · NICHT GEPRÜFT

## 1. Methode

- SHAs live per `git ls-remote origin main` (beide Repos).
- GitHub Actions über die GitHub-API gelesen: Runs, Jobs (Step-Ebene), Job-Logs. Log-ZIP-Download über den Proxy blockiert (HTTP 403), daher Job-Logs über `get_job_logs`.
- Rulesets unauthentifiziert über `GET /repos/…/rulesets/<id>` und `GET /repos/…/rules/branches/main` zurückgelesen.
- Render über das Render-API-Tool (`list_deploys`, Workspace `tea-da5lqvuk1f9s73918ul0`).
- Code in sauberen Kopien per `git archive` der beiden `main`-SHAs, Node v22.22.2 / npm 10.9.7:
  FE `npm ci && npm run typecheck && npm test && npm run build`, `node --test scripts/*.test.mjs`; BE `npm ci --ignore-scripts && npm run test`.
- Drive-Rücklesen über den Drive-Connector (nur lesend).
- Keine Re-Runs, kein `workflow_dispatch`, kein E2E ausgelöst, nichts gelöscht.

Zugriffsvermerk: AGENTS.md (Scope) untersagt den Zugriff auf andere Repositories. Der Startprompt des Menschen schreibt das Lesen von `n8n-workflow-factory` ausdrücklich vor. Ich werte das als ausdrückliche menschliche Freigabe im Sinne des Human Gate „Zugriff auf neue Repositories“. Der Zugriff war nur lesend. Freigabe durch den Menschen am 2026-10-01 bestätigt (lesend).

## 2. Ergebnisse

### 2.1 SHAs (BELEGT)
- FE `main` = `2a6760df18ce1af7de5851c9dd2ccdea5378d87d`, BE `main` = `6835adb116c31e87cf45bfcfee51b883b0cef35e`. Beide gleich Startprompt Abschnitt 3, keine Abweichung.
- `config/backend-runtime-truth.json` pinnt `6835adb…` / `srv-daqk0sp7lnhs73d9nr7g`.

### 2.2 Pre-Merge (BELEGT)
- FE#39 gemergt 2026-09-30T19:36:29Z, Head `9e0b8f50f05237c426e8c9b4a7abeffcd7efc55d`: `build` success (Run 36766645354), `deploy-test` success (Run 36766645676), `design-sandbox-guard` success (Run 36766645358), `real-e2e-contract` success, `real-e2e` skipped (PR, erwartet).
- BE#40 gemergt 2026-09-30T19:29:42Z, Head `4359b679307c3a75ddad21d7539244146d1faad8`: `verify` success (Run 36764518903).
- Rulesets zurückgelesen: FE `protect-main` 23705450 `enforcement=active`, Ziel `~DEFAULT_BRANCH`, strict=true, required `build`, `deploy-test`, `design-sandbox-guard`, squash-only. BE `Protect Main` 23936816 `enforcement=active`, strict=true, required `verify`. Effektive Regeln für `main` (`rules/branches/main`) stimmen mit den Rulesets überein.
- `bypass_actors: []` wurde **unauthentifiziert** gelesen. ANNAHME: vollständig. GitHub zeigt Bypass-Akteure möglicherweise nur Admins; das wäre mit Admin-Token zu bestätigen.
- Doku-Abweichung: AGENTS.md nennt nur `build` + `deploy-test`. Das Ruleset verlangt zusätzlich `design-sandbox-guard`. Strenger als dokumentiert, nicht blockierend.

### 2.3 Post-Merge FE (BELEGT, Runs alle `event=push`, `head_sha=2a6760d…`, Attempt 1)
| Workflow / Job | Run-ID | Job-ID | Ergebnis |
|---|---|---|---|
| `ci.yml` / `build` | 36766853272 | 110063067492 | success (alle Steps success) |
| `cloudflare-deploy-test.yml` / `deploy-test` | 36766853288 | 110063068614 | success; „Upload version (no traffic)“ success |
| `real-e2e.yml` / `real-e2e` | 36766853195 | 110063067296 | success |
| `real-e2e.yml` / `real-e2e-contract` | 36766853195 | 110063069674 | skipped (erlaubte Ausnahme) |

Real-E2E-Log (Job 110063067296, 19:37:43Z), Vorschau `https://74b53278-alpha-frontend-design.vantaria-labs.workers.dev` (Version `74b53278-526e-4769-9ad0-8f02b719853f`), `VITE_FACTORY_MODE=http`, Backend `https://api.vantarialabs.tech`:
```
jobId cmuoibljs000038o1w9zcx4bg · submittedStatus WAITING_FOR_APPROVAL · approvalVersion 11
n8n {pass:true, executionId:"32", importedId:"OoVSr582nMZDGjaG"} · completed:true
drive {status:"COMPLETE", auftrag 1811sdzy…, workflow 1OU_aeJe…, testReport 1dxO--vH…,
       finalWorkflow 1xiKjs7Q…, documentation 1LWVhSr7…, persistedReportMatches:true}
REAL_E2E_PASS
```
Geschäftsablauf bis Drive `COMPLETE` mit 5 IDs und idempotentem Rücklesen: belegt.

**Cleanup nicht OK** (19:38:26Z):
```
cleanup {status:"CLEANUP_INCOMPLETE", n8n:{outcome:"DELETED", workflowId:"OoVSr582nMZDGjaG"},
 drive:{outcome:"INCOMPLETE", files:[ auftrag TRASHED, workflow TRASHED,
   testreport 1dxO--vH7r2rPDbp_flFT9PsneECfCmDV FAILED DRIVE_REQUEST_FAILED,
   final-workflow 1xiKjs7Q46K5CkRHjbIxmf4muFtp3Ci1d FAILED DRIVE_REQUEST_FAILED,
   documentation TRASHED ]}}
##[warning]R05_CLEANUP_STATUS=CLEANUP_INCOMPLETE
```
Der Job bleibt trotzdem grün (so gewollt seit R-05, Governance-Test 47). Die Vorgabe `evidence.cleanup = CLEANUP_OK` ist für diesen Lauf **nicht erfüllt**. Ob die beiden Dateien noch in 03-TEST / 04-FERTIG liegen, ist NICHT GEPRÜFT: Der Drive-Connector findet weder diese noch eine erfolgreich getrashte Vergleichsdatei (`Requested entity was not found`). Er hat also keinen Zugriff auf das Archivkonto. Die Abweichung steht nicht im LOESCHPROTOKOLL, obwohl dessen Hinweis Abweichungen einzeln verlangt.

Nebenbefund: Für den vorherigen `main`-SHA `6da4c091…` (FE#38, nur `evidence/`) gibt es keinen Real-E2E-Push-Run. `real-e2e.yml` hat bei `push` absichtlich `paths-ignore: evidence/**, release/**` (Governance-Test 36). Promotion 36766223145 / 36766702201 für diesen SHA endete mit `skipped`. Siehe Abschnitt 4.

### 2.4 Promotion (BELEGT)
- `production-promotion.yml` Run 36767079723 (`workflow_run`, head `2a6760d…`), Job `promote` 110063830873 success.
  Log: `{"status":"POST_MERGE_TRUTH_PASS","evidence":[ci.yml 36766853272, cloudflare-deploy-test.yml 36766853288, real-e2e.yml 36766853195]}` → `PROMOTION_GATE=PASS` → `wrangler deploy` → `Current Version ID: dba1534a-bbff-4dbe-a551-1463a7078f13`, Custom Domain `control.vantarialabs.tech`.
- `post-deploy-production-gate.yml` Run 36767170763, Job `production-gate` 110064145274 success:
  CF-Readback vor/nach E2E `activeVersion=dba1534a…`, `matchedExpected:true`, `stable:true`; n8n-Preflight PASS; Produktions-E2E Job `cmuoifgco000138o14218qleq`, n8n-Execution 33, Drive COMPLETE (5 IDs), **`cleanup.status=CLEANUP_OK`** (n8n DELETED, 5× TRASHED); `POST_DEPLOY_PRODUCTION_E2E=PASS`; Artifact 11121786528 (sha256 `710b00c1…c5c71`).

### 2.5 Post-Merge BE (BELEGT)
- `handwerkflows-verify.yml` Run 36766063466 (`push`, `main`, head `6835adb…`), Job `verify` 110060419185 success (Typecheck, Tests, Next-Build, Audit).
- Render `srv-daqk0sp7lnhs73d9nr7g`: neuester Deploy `dep-daum6su417fc73fe5b2g`, Commit `6835adb116c31e87cf45bfcfee51b883b0cef35e`, `status=live`, Trigger `new_commit`, fertig 2026-09-30T19:32:14Z. Quelle: Render-API `list_deploys`. Vorgänger `dep-daulbim0tbcc73dpdaig` @ `5a38424` ist `deactivated` (Rollback-Basis).

### 2.6 Runtime-Pin (FAIL)
- Der Main-Push-Job `real-e2e` ruft nur `node scripts/real-business-e2e.mjs` auf (`.github/workflows/real-e2e.yml:145`). Dieses Skript liest weder `/api/runtime-truth` noch `config/backend-runtime-truth.json` (grep: 0 Treffer).
- Das Frontend nutzt `/api/runtime-truth` nur als Session-Probe (`src/App.tsx:146-161`: `200 → authenticated`). `repository`, `branch`, `commitSha` und `serviceId` werden dabei nicht verglichen.
- Den exakten Vergleich enthält nur `scripts/real-e2e-smoke.mjs` (Zeilen 17, 40, 155). Kein Workflow ruft dieses Skript auf. Seit `f293cbe` (FE#16, 2026-09-27) ist es aus `real-e2e.yml` entfernt.
- Folge: Im Real-E2E-Log gibt es keinen Beleg für einen Runtime-Truth-Abgleich. Die Pin-Datei hat keine Wirkung. Die Aussagen in FE#39 („sonst schlägt Real E2E am Runtime-Truth-Abgleich fehl“), in BE README Z. 109 („fail closed if its expected backend runtime truth cannot be proven“) und in Audit P1-Closure (Abschnitt „Runtime-bound Real E2E“) treffen für den aktuellen Stand **nicht** zu.
- Render LIVE = Pin gilt nur durch 2.5 (Render-API), nicht durch das E2E. ANNAHME: Zur Laufzeit des E2E (ab 19:37:14Z) lief `6835adb`, weil der Deploy um 19:32:14Z live war und danach kein neuer Deploy folgte.

### 2.7 Fachlich R-06
FE `src/services/factory/HttpFactoryService.ts`:
- `403→FORBIDDEN`, `429→RATE_LIMITED` (Z. 68, 71). Die 429-Meldung nennt die Retry-After-Sekunden, sonst „später“ (Z. 84-89). BELEGT.
- HTML (`text/html` oder Body beginnt mit `<`) wird nie roh angezeigt: ≥500 → „HTTP n: Dienst vorübergehend nicht erreichbar.“, sonst „HTTP n“ (Z. 90-94). Klartext wird nach 300 Zeichen gekürzt (Z. 106). BELEGT.
- Timeout → `network/TIMEOUT`, Netzwerk → `network/NETWORK` (Z. 349-350). BELEGT.
- Hinweis H1: Ein JSON-`{error}`-String wird ungekürzt und ungeprüft durchgereicht (Z. 98-100), der Grenzwert von 300 Zeichen gilt dort nicht. Bei `NETWORK` wird `cause.message` des Browsers angezeigt (Z. 350). Das ist nicht blockierend, aber keine lückenlose Garantie „keine Freitext-Fehlerausgabe“.
- Tests: `HttpFactoryService.test.ts` enthält 403/418, 429 (3 Varianten), HTML 502/503/404 und die Kürzung. TIMEOUT/NETWORK stehen in Z. 417 und 431.

BE `lib/orchestrator/agents.ts`, `n8n-native.ts`, `public-contract.ts`, `app/api/orchestrator/route.ts`:
- OpenAI: `OPENAI_MAX_ATTEMPTS=2`, nur `{429,503}` (Z. 77-78). Kein Retry bei Timeout/Netzwerk (Z. 109: sofort `LLM_TIMEOUT` / `LLM_NETWORK`). Wartezeit aus Retry-After ≤ 5 s, sonst 1 s (Z. 82-86). Also genau ein Retry. BELEGT.
- Gemini: `GEMINI_TIMEOUT` / `GEMINI_NETWORK` (Z. 60). n8n: `EXTERNAL_TIMEOUT` / `EXTERNAL_NETWORK:<Stufe>` ohne Anbietertext (`n8n-native.ts` `formatExternalTransportError`). BELEGT.
- POST-500: `publicErrorCode()` ersetzt Freitext durch `INTERNAL_ERROR` (`route.ts:134`).
- Hinweis H2: Die Regex `^[A-Z][A-Z0-9_]*(?::[A-Z0-9_]+)?(?: .*)?$` lässt **beliebigen Text nach einem Großbuchstaben-Präfix und Leerzeichen** durch. Lokal geprüft: `"ECONNREFUSED 10.0.0.5:5432"` und `"P1001 Can't reach database server at <host>:5432"` → durchgereicht. Eine reale Fehlermeldung dieser Form ist NICHT BELEGT (Prisma/Node-Meldungen beginnen üblicherweise klein oder mit „Can't“ und werden abgefangen). Das Restrisiko ist ein Host/Port-Leak.
- Tests: `__tests__/error-classification.test.cjs` mit Transportklassifizierung, Freitext-Filter, Timeout/Netzwerk je Anbieter, Retry-Matrix (429/503 → 2 Aufrufe, andere → 1), Erfolg nach 429 (Tokens einmal gezählt) und Retry-After-Grenzen.

Lokale Ausführung (saubere Kopien, Node v22.22.2):
| Befehl | Exit | Ergebnis |
|---|---|---|
| FE `npm ci` | 0 | |
| FE `npm run typecheck` | 0 | |
| FE `npm test` | 0 | 8 Dateien, 130/130 |
| FE `npm run build` | 0 | |
| FE `node --test scripts/*.test.mjs` | 0 | 47/47 |
| BE `npm ci --ignore-scripts` | 0 | |
| BE `npm run test` | 0 | 107 + 14 + 6 + 7 = 134/134 |

### 2.8 Negativpfade (CF-PM-001 Nr. 7)
Belegt durch `promotion-gate.test.mjs` / `post-merge-governance.test.mjs` / `real-e2e-governance.test.mjs` (lokal 47/47):
- Entfernter Main-Trigger: Test 6 (deploy-test) und Test 36 (real-e2e, Push-Trigger-Form) schlagen fehl. Manuelle Promotion wird verworfen (Test 10).
- Übersprungener oder fehlgeschlagener Schritt: Tests 20, 21, 22, 25, 26, 30 und 31 blockieren. Nur `real-e2e-contract`-skip ist erlaubt (Test 24).
- Veraltete Evidence oder anderer SHA: Tests 17, 29 und 32 blockieren. Fehlender Run (Test 28) und fehlender Workflow (Test 27) blockieren.
- Fehlende Credentials: Workflow-Step „Require approved browser credentials“ (real-e2e) bzw. „Require runtime credentials“ (post-deploy). Das Skript bricht mit `MISSING_REQUIRED_ENV` ab. Belegt im Code, nicht durch einen Negativlauf.
- Nicht erreichbare Runtime: Die n8n-Preflight-Klassifizierung `BLOCKED_EXTERNAL` im Post-Deploy-Gate ist belegt. Die Negativskripte `real-e2e-backend-unavailable-negative.mjs` und `real-e2e-status-mismatch-negative.mjs` beziehen sich auf das **nicht verdrahtete** `real-e2e-smoke.mjs` und laufen in keinem Workflow.
- **Falsche oder veraltete Backend-Runtime (Pin-Mismatch): kein Negativpfad**, siehe 2.6.

## 3. Klassifikation (CF-PM-001 Nr. 8)

| Prüfpunkt | PASS | FAIL | UNKNOWN / INSUFFICIENT EVIDENCE | NOT PROVEN | NOT AUDITED — TIME LIMIT |
|---|---|---|---|---|---|
| 1 SHAs live | X | | | | |
| 2 Pre-Merge-Checks FE#39/BE#40 | X | | | | |
| 2 Ruleset-Durchsetzung | X (required checks, strict, active) | | bypass_actors nur unauthentifiziert gelesen | | |
| 3 FE build / deploy-test (push) | X | | | | |
| 3 FE real-e2e Geschäftsablauf bis Drive COMPLETE + 5 IDs | X | | | | |
| 3 real-e2e `evidence.cleanup = CLEANUP_OK` | | X (CLEANUP_INCOMPLETE, 2 Drive-Dateien) | Verbleib der 2 Dateien | | |
| 4 Promotion + Post-Deploy-Gate, CF-Version | X | | | | |
| 5 BE verify (push) | X | | | | |
| 5 Render LIVE = 6835adb | X | | | | |
| 6 Runtime-Pin im Real-E2E | | X (Mechanismus nicht verdrahtet) | | | |
| 7 Code/Tests R-06 | X (mit Hinweisen H1, H2) | | | | |
| 7 Lokale Läufe FE/BE | X | | | | |
| 8 Negativpfade | X (Trigger, Skip/Fail, Stale, Credentials im Code) | X (Pin-Mismatch / falsche Runtime) | | Unerreichbares Backend im Main-E2E: kein Negativlauf | |
| DB `cleanupStatus` | | | X (kein DB-Zugriff) | | |

## 4. META-AUDIT (CF-PM-001 Nr. 10)

- **Kann eine ausgelassene Runtime-Verifikation trotzdem PASS ergeben? Ja.** Läuft Render auf einem anderen oder veralteten Commit, ist aber API-kompatibel, bestehen `real-e2e`, Promotion und Post-Deploy-Gate. `config/backend-runtime-truth.json` wird von keinem ausgeführten Schritt gelesen. Die Enforcement-Schicht „backend deployment SHA and runtime verification“ (Nr. 4) ist damit **INCOMPLETE**.
- Ausgelassene Pflichtschritte `build`, `deploy-test` oder `real-e2e` für den Promotion-SHA: kein PASS möglich. Das Gate verlangt den exakten Push-Run je Workflow, belegt durch 17 Tests und den Live-Lauf.
- `paths-ignore` bei `real-e2e` (push): Für reine `evidence/`- oder `release/`-Commits läuft kein E2E. Es folgt keine Promotion, aber auch kein sichtbarer Fehlschlag. Das ist fail-closed für Produktion, widerspricht aber dem Wortlaut von Nr. 2 („for every main update … visible result“). Widerspruch zwischen Regeltext und bewusster, getesteter Implementierung → Entscheidung Chef/BOSS.
- Cleanup-Status beeinflusst das Urteil nicht (Test 47). Ein `CLEANUP_INCOMPLETE` erscheint nur als Warning, nicht als Fehlschlag.

## 5. Befunde an zuständige Rolle

- **B1 (blockierend) → Alpha-Deploy / Chef:** Runtime-Pin-Abgleich (`repository`, `branch`, `commitSha`, `serviceId` gegen `config/backend-runtime-truth.json`) muss vor `REAL_E2E_PASS` im Main-Push-`real-e2e` laufen (und sinnvollerweise im Post-Deploy-Gate). Dazu ein Governance-Test, der das erzwingt, und ein verdrahteter Negativpfad für Mismatch und nicht erreichbares Backend. Änderung an `.github/workflows/` und `scripts/` nur nach Freigabe durch Chef.
- **B2 (blockierend für R-06-Abnahme) → Backend / Chef:** Main-Push-Lauf 36766853195 meldet `CLEANUP_INCOMPLETE`. Die Drive-Dateien `1dxO--vH7r2rPDbp_flFT9PsneECfCmDV` (testreport) und `1xiKjs7Q46K5CkRHjbIxmf4muFtp3Ci1d` (final-workflow) wurden mit `DRIVE_REQUEST_FAILED` nicht getrasht. Offen sind die Ursache (extern/Drive vs. Produkt) und der Verbleib. Nachtrag ins LOESCHPROTOKOLL nötig (Evidence-Ordner, nicht Schreibbereich QA).
- **H1 → Alpha-Core (FE):** JSON-`{error}` ungekürzt/ungefiltert durchgereicht (`HttpFactoryService.ts:98-100`).
- **H2 → Backend:** `PUBLIC_ERROR_CODE` lässt Freitext hinter Code-Präfix durch (`public-contract.ts`). Vorschlag: nur `CODE(:STAGE)?` plus die bekannte `EXTERNAL_HTTP_…`-Form erlauben.
- **H3 → Chef:** Doku-Drift. AGENTS.md nennt `design-sandbox-guard` nicht als Required Check. Audit P1-Closure, BE README Z. 109 und FE#39 beschreiben einen Runtime-Pin-Abgleich, der nicht mehr läuft.
- **H4 → Chef/BOSS:** Entscheidung zu `paths-ignore` versus CF-PM-001 Nr. 2 (siehe 4).
- Offen: Zu R-06 gibt es keine Evidence-Datei unter `evidence/roadmap/` (Schreibbereich Chef).

## 6. Human-Gate-Bedarf

- Freigabe von Workflow- und Skriptänderungen für B1 (Alpha-Deploy). Jede Änderung auf `main` löst Real E2E und Produktions-Promotion aus (Merge = Deploy FE; Rollback-Basis FE `1a64751` / CF `4f236955-8e6c-418f-9b21-49463cb4642c` bzw. aktuell `dba1534a…`).
- Klärung und gegebenenfalls manuelles Trashen der 2 Drive-Dateien aus B2 (Löschung = Human Gate, BOSS).
- Admin-Rücklesen von `bypass_actors` beider Rulesets.
- Kein E2E-Lauf, kein Re-Run und keine Löschung wurden durch diesen Audit ausgelöst.

STATUS: BLOCKIERT — B1 (Runtime-Pin im Real-E2E nicht verdrahtet, META-AUDIT: falsche Runtime kann PASS ergeben; Alpha-Deploy/Chef) und B2 (`CLEANUP_INCOMPLETE` im Main-Push-E2E; Backend/Chef).

---

## Nachtrag 2026-10-01: `main` hat sich weiterbewegt (nicht neu auditiert)

Das Urteil oben gilt nur für FE `2a6760d…` / BE `6835adb…`. Live-Stand beim Einreichen (`git fetch` bzw. `git ls-remote`, 2026-10-01): FE `main` = `aa7495d58a24d42fa14324f107a38078f73db6fa` (15 Commits später), BE `main` = `1a1bce3d31c033078aab318225daf02e8b2bb537`.

Nur auf Code-Ebene gelesen (`git show origin/main:…`), ohne Runs, Render oder Tests:
- B1: `scripts/real-business-e2e.mjs` liest jetzt `config/backend-runtime-truth.json` (Z. 29-30) und ruft `/api/runtime-truth` auf (Z. 171-182; Commit `771755d`, FE#40). Wirkung im Main-Push-Lauf und Negativpfad: NICHT GEPRÜFT.
- H1: Der JSON-`{error}`-String wird jetzt ebenfalls gekürzt (`HttpFactoryService.ts`, Funktion `truncated`).
- B2: Die Abweichung ist im LOESCHPROTOKOLL nachgetragen (Z. 67). Der Status der Dateien lautet dort „ERLEDIGT (ANNAHME)“. Ursachen-Fix laut Protokoll in BE#41: NICHT GEPRÜFT.
- H2 (BE-Regex), H3 und H4: nicht nachgeprüft.

Für eine Freigabe ist ein neues Audit auf dem aktuellen `main`-SHA nötig.
