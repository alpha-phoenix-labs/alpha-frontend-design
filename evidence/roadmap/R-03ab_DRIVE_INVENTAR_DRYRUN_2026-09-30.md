# R-03a/b – Google Drive Testartefakte: Inventar + Dry-run (ENTWURF, keine Löschung)

Stand: 2026-09-30 · Roadmap Punkt 3/20 · Drive-Root `1B7k95EDdl-rnxG1rCt_q7SycmZn8oLrQ` (enthält genau 4 Ordner: 01-AUFTRAEGE, 02-WORKFLOWS, 03-TEST, 04-FERTIG; sonst keine Dateien)
Human Gate: Nichts gelöscht, verschoben oder geändert. Nur Metadaten + Inhalt der Auftrags-/Testreport-JSON gelesen (keine PII gefunden).

## Befund
- 105 Dateien = 21 jobIds × 5 (auftrag/01, workflow/02, testreport/03, FINAL_workflow/04, documentation/04); alle erstellt 2026-09-26…2026-09-29, Eigentümer = Projekt-Drive-Account.
- 04-FERTIG enthält ausschließlich diese 42 Test-Ergebnisdateien (21 × 2) – keine anderen Endergebnisse.
- 25 Datei-IDs werden in FE `evidence/CRAFTFLOW_M1_RELEASE_MANIFEST_2026-09-29.md` / `M1_PRODUCTION_EVIDENCE_2026-09-29.md` referenziert = exakt die 5 Anker-Jobs × 5 (Abgleich per Skript: 0 Abweichungen).
- Korrelation nur über Dateiname/appProperties `hfJobId`+`hfKind` (BE `lib/integrations/drive-api.ts:87,98`); keine correlationId in Drive-Metadaten. correlationId nur im Prompt von cmun7vi43 (`craftflow-m1-36636521340-1`).
- Widerspruch zu Dossier §10 („0 Treffer in 01/02/03“) und Agentenanweisung §4.4 („5 Testdateien“): live 63 Dateien in 01–03 + 42 in 04.

## Klassifikation je jobId
| jobId | Klasse | 01 auftrag | 02 workflow | 03 testreport | 04 FINAL | 04 documentation |
|---|---|---|---|---|---|---|
| cmuh65gdm000033lz59wtkm57 | A1 – Kandidat (Standard-E2E-Prompt) | 1A49ZZFxRmWspHaONbfHCV2lOEjFyzNzH | 1B7CLoiKCavJ4fcN9kAMWOlFrQGStUoEB | 1quCs_0Ut8abm0y6gJVafF0OjeHnaDxb1 | 1_JFSIKebCSeHHcveURMt7VBFx4OlN2Ku | 1EJfu6W1iuVmfLUUbimdz06vikTpteMxg |
| cmuk5puc80000cc444v1jzuat | A1 – Kandidat (Standard-E2E-Prompt) | 1adXaxnAmaSCShqO9VhYV-Ur3CHVdOUD5 | 1ecxzGuTW4tyXTMeVWam5otbLF0nkDpYD | 19t-xyrVwOpf1AKDmPnP5XrSZeCfCvntI | 1DBZm7ySgFe5Tl7vGka2UDi7dB2qgUh0m | 1bx6aIeVlksGJbFvfUTnhKq3pt7dNchLx |
| cmukb7kma000012x8gwq7jdq1 | U – UNKLAR (manueller Kurzprompt) | 1pZ8L6Ge2u1F0GWPpwKa2KhHQwCS2mwdY | 1Qek1vumCtge8Yp7YgH4iUqFQZOuQzZl8 | 1a0OnNnuU4BW-BYYR5qqdrV8JeC8HhVQE | 11XwMFSMuFgnvHCGpvEomCNlErXAcuERa | 1DlGlQDrGoE_26kwfhnnAfl4Bm6Ucu8CT |
| cmukdh8bg000040vwk1831h1g | A1 – Kandidat (Standard-E2E-Prompt) | 1nyQopuoNBA3517B6qMlXesJlmGkksAjQ | 1vv5GO9OSV46ioLvFVymfRvtCcaZ2XAYd | 1X_RnXGApyjNo56COeyh6XRS78zOlfgMz | 17L5Krb76q2Y8Q5LQRiyLDT_PC2RgojEJ | 1HjJB205p32hjgxMyL51y_6H5Z_4qP6yo |
| cmukf9w8p000014j5ypk5an5y | A1 – Kandidat (Standard-E2E-Prompt) | 1fwmRrDMO-2yCZwzJvbPz_csKuc2vrdrb | 1soF3koxIQ1Q8mku-LvlB5o84kD_2q94j | 1p3gSbOlwvonHzvRYzl-nw_RfVKds6Ldi | 1pBMUsPglvCros9WrUILFdthKeBMRmNIa | 1E9GJsFpJRTZeCD2GTCOpd0TsAvX4Sikz |
| cmukh1so40000grpzqt0wkkxa | A1 – Kandidat (Standard-E2E-Prompt) | 1rPDQQpmmhBj24xF-_mJ_E51bx3KlCTtR | 18veoGenw8TmshrT-ZrnQZ1XPDe1WeLdJ | 1WDF1o12-cA4il8XPQJUgrVA_c9C2cRAO | 1d3jj6eKE6re_EJQ9Nwcvg8embnPo53LC | 1m4R_NB5Mt6C94GQVmN3h5RzN5SHejDI7 |
| cmukh5ylt0002grpz9phsemg3 | U – UNKLAR (manueller Kurzprompt) | 1NJVeg4riX4w_pV4lZHCtSJ7PnnwQp7zV | 1xuqHp6-h-swwkat3A6RuZwTQs0WlxhOS | 1wlavHb0ehLbVUPR7DEJ6zRv3kWn0dhl3 | 1P_Swm-uXsS9GJsGFyI5_ToLcr6utWiEr | 1C_d0obKLPyQ4uR5YmCshlhDDmVoyEXwK |
| cmukhkowl0000df1zq2on6q1n | A1 – Kandidat (synthetischer Testprompt) | 1o-W2iZv-I3Qg_U53dfsphuJvmRKBpDGC | 196b4pE1Me4osb7DsSAFutZ_Cg8w1pyEp | 1LJz8BiJID043fNQQyyYsh78Dr_edpdFj | 1geknVHKOILnaC2CB55ZHQg_RvUKZNjDN | 1Mvp_cS5sJtGnjwM1wTRF4OnV7LKlS93O |
| cmukxjt4n0000nms2ev9254in | A1 – Kandidat (Standard-E2E-Prompt) | 1eZMR1NzuhtcZ87xJ5soAdK1QV9petmXr | 1WbaxurENTOXTthGknaQ2HlolXM8wMQvf | 1crh_uLRH7MAPlSrdyAGEfq0kOvP9vvpv | 1lVdibC1c1MZymsYgCrR8X7HacRyZCC8a | 1ZEVG1kvLiBo4akQNRU05yAOL1N3gc-_f |
| cmul2mek40002nms26gjijbql | A1 – Kandidat (Standard-E2E-Prompt) | 1TZ0oMazIXCV-WicoFH4ET1sG7ZyD9VCv | 13EyQ_UCgX7wWeoXydh1M-czibOlnqiEB | 1CUd7wnykpm7OVg5cDHWlqZvBwKkHE1sU | 1Ny5Bd7xrctZKW_e49Cn68nXtA00xL3fp | 1SbkhhIkmaRRV_6vjkOKfINdpk1nx6gCU |
| cmul2ywq20003nms2lp7tr3u1 | A1 – Kandidat (Standard-E2E-Prompt) | 1Q3EW-urDW1lXNzzpPZuF_WY3_-DXPCJ4 | 13ke78fbvwnNQJusP55aaCFc7dk3ve-MA | 1MtL5TTnHyyH4sMl5ogbisLwPFWOrmsxm | 1D1sE3dwcZ6zXi6n3y8QT-WYfRS4ccVK5 | 1Bn6jD-bF79MBScPWdO7guAY3Q9K0gJi7 |
| cmulwajfs0000xscchqsbr1cq | A1 – Kandidat (Standard-E2E-Prompt) | 17AQyTjnRNpeAm0c8irxNghQBq3cd061N | 10j2oBKjQ1CVdECS0qFn4-xQPnmJZPezB | 1kyktowdL6iWAvReV5XAekHxJZ6A0Pf_K | 1qjVKIjaxcpS1vbcMdhTsZZkPOSpQcY6N | 1Wve7r0rFnf_ptHiXzi4uhSODL6pnOFmb |
| cmulwh3nb0001xsccndho402e | B – Evidence-Anker, BEHALTEN | 1npSOOl83EKBGZabsY0_wBSg74t3nR3wq | 1jBO0C-Z10gZ5faCwUeeM1bzcKsHYWa5v | 1WQkA_yluObvk8p3cxkHxioUbFyWFA2Dd | 1LkJSWcwt0ESksXq5WWv9rmteNwPCTWuB | 1SE7v_VrgtxlBLFae5-9XBJVkcUkO7zK7 |
| cmulwnkjt0002xscc1hc4a5t2 | B – Evidence-Anker, BEHALTEN | 1i-Zc04eiYTELujOpK1nmJHBhuiZvbf1y | 1YQ-v7CTAdWfG9T8HJeiHs9po18h0WXx9 | 1jyNi8nNtp7XseqWzXgeNaxmVXIfE9OCc | 1ruzOVN50lJ7EYHoxgUc9czK016ASMjC5 | 1gnlzldoxZzKHIMHNuAx8Kj87OiwQI81q |
| cmulwpe1b0003xscckkfy880h | B – Evidence-Anker, BEHALTEN | 15S9BsT3o9WIdW-hq0pkCE7rRWZgYlNn1 | 1MtgyQBf6yfixC8fKW2pLZ-oDgYpLQ89m | 1E9eG8W3JzEeS1HKDP9EdmCb54Qwbo5ec | 1zi7q5IwboyymQuU2c-FczEZVu6mApLdb | 1wSVFrSb3Cg-aE7CgEKIdgwJXUdhSHGmD |
| cmulwry8x0004xsccaofpjzhu | B – Evidence-Anker, BEHALTEN | 1LMNqsL6EF1B00G9HdgDJ5dtv5BENsVv7 | 1fBIDNoKDxPjAulYQJEZOem4caE9SCDwB | 1zl8h9Mrzl3UYqwvbyzGNggj-QG2xesJF | 1GSfeNWRGBhBxVYfPwRfA3EG1M-sLVyjn | 1YM-eoVyyss3YIJjX98AG0eNsa_V2ZeF9 |
| cmun5u6ol000313vmesll7g72 | A1 – Kandidat (Standard-E2E-Prompt) | 1qC9ZornJNWw4ji6JBFneR7ICbanZmbKc | 1eGtCmKxJk0Se58dCosW48N7iVz_-wjtp | 1S1HiJu44egdvggq08enWIcSyMIKmU70T | 1IAXr3InHsXaqJTzp9BOq1Yxb4uZhESef | 14mgK717YRvPTpYJkpSoIIXCP1q9sI3Dr |
| cmun7tccd000413vmpqsxfd3t | A1 – Kandidat (Standard-E2E-Prompt) | 19ugSSb_2YquU0gRGz1d2pwfs3UrGy5xX | 1vxy58RaDFTz6DP6ZQGpv-KxMOqgEiHAL | 1Ud01g_c6haO3dCiNaAwRT7lajSJDxxmf | 1o-mm8e_Ld_-Z_B6lwmhDH9poJHbr8Ry8 | 1GK2NzPMECq39yjdY_1d2owJGDo50QX1Z |
| cmun7vi43000513vmstekhbie | A1 – Kandidat (Standard-E2E-Prompt) | 1cZ0W0vfpqPYigNRIknPpyOHnFKvpPkgY | 1xeZF4628Xqrro3KPlrWSY5PzBF9IBHYw | 1PuPrkzjF2LGXdoaUK0ri59PMkhKa9TP6 | 1oB6hh_dAxRk3-ATmvhSZ62KYQIaYClGZ | 1W_I-1CicK0W13WIUCS5Ge1DBAIq-F-uf |
| cmun9b5gc000613vmltmyi5r5 | A1 – Kandidat (Standard-E2E-Prompt) | 1rZ2seCGUCvtz0BoC-WOEpg-edrQHRIrv | 17O2KEev00qML1-lRi1qpjay3oYriFiBF | 1EYkiiCBffELSvPQMx8EEpQke2MW4zENj | 1yB-lZeCsU2a1EcC5K2VwxPfloH_BmoPa | 1_HR3nYTn8Me8smcYFelEeiA20Gvk0MnA |
| cmun9dco4000713vmm204gj8l | B – Evidence-Anker, BEHALTEN | 1fYmblUkGSvAv8JIZQgDs_Zipl5limeYc | 12dJXptGiyduoYHlR2kJslwqKQXJ2fhoH | 1mkYMokiZ4s8YqPrNp-f6de1Wf6mellhY | 14dVeezbqO9Ao43i3Mb9erGnJPj0MwLIX | 1Qqk3wryoht2H2pJc33XZQMMKTS0jhDYf |

## Dry-run („würde in den Papierkorb verschieben“)
- **Batch 1 (01–03):** 14 Jobs × 3 = 42 Dateien (Spalten 01/02/03 der Klasse A1). Methode: Drive-Papierkorb (30 Tage wiederherstellbar), einzeln, Protokoll je Datei-ID.
- **Batch 2 (04-FERTIG):** 14 Jobs × 2 = 28 Dateien – **gesperrt** durch Projektregel „fertig wird nicht angefasst“; nur mit ausdrücklicher BOSS-Ausnahme.
- **Nicht anfassen:** B (5 Jobs/25 Dateien), U (2 Jobs/10 Dateien: cmukb7kma „Erstelle einen einfachen workflow“, cmukh5ylt „Email workflow mit priority“ → BOSS bestätigt Testcharakter).
- Kriterien (Regel 5, Ersatznachweis analog BOSS-GO Frage 3): jobId ✓ (Dateiname+Inhalt), Testmarker ✓ (synthetischer E2E-Prompt im Auftrag), Zeitfenster ✓ (25.–29.09.), Besitzer = Projekt-Account (kein Kunde).
