# R-03b – Drive Batch 1: Löschprotokoll + Nachinventar (ENTWURF)

Stand: 2026-09-30 · Roadmap Punkt 3/20 · BOSS-GO „Go bis gate“ auf Batch 1 (42 Dateien, Liste R-03ab Klasse A1, Spalten 01/02/03)
Methode: Google-Drive-Connector `trash_file` (Papierkorb, kein endgültiges Löschen), je Datei einzeln. Wiederherstellung nur durch BOSS in der Drive-UI (Connector kann nicht wiederherstellen).

## Vorab-Inventar (live, direkt vor Ausführung)
- 01-AUFTRAEGE 21 · 02-WORKFLOWS 21 · 03-TEST 21 = 63; alle 42 Kandidaten mit erwartetem Titel und Ordner vorhanden.
- Guard (Skript): 42 IDs, 0 Evidence-Anker, 0 UNKLAR (manuell), 0 aus 04-FERTIG. Batch-Datei sha256 45bdd155…cc63.

## Protokoll je Datei (Ergebnis `{}` = Erfolg laut Connector)
| # | Datei-ID | jobId | Art | Ergebnis |
|---|---|---|---|---|
| 1 | 1A49ZZFxRmWspHaONbfHCV2lOEjFyzNzH | cmuh65gdm000033lz59wtkm57 | auftrag | trashed (`{}`) |
| 2 | 1B7CLoiKCavJ4fcN9kAMWOlFrQGStUoEB | cmuh65gdm000033lz59wtkm57 | workflow | trashed (`{}`) |
| 3 | 1quCs_0Ut8abm0y6gJVafF0OjeHnaDxb1 | cmuh65gdm000033lz59wtkm57 | testreport | trashed (`{}`) |
| 4 | 1adXaxnAmaSCShqO9VhYV-Ur3CHVdOUD5 | cmuk5puc80000cc444v1jzuat | auftrag | trashed (`{}`) |
| 5 | 1ecxzGuTW4tyXTMeVWam5otbLF0nkDpYD | cmuk5puc80000cc444v1jzuat | workflow | trashed (`{}`) |
| 6 | 19t-xyrVwOpf1AKDmPnP5XrSZeCfCvntI | cmuk5puc80000cc444v1jzuat | testreport | trashed (`{}`) |
| 7 | 1nyQopuoNBA3517B6qMlXesJlmGkksAjQ | cmukdh8bg000040vwk1831h1g | auftrag | trashed (`{}`) |
| 8 | 1vv5GO9OSV46ioLvFVymfRvtCcaZ2XAYd | cmukdh8bg000040vwk1831h1g | workflow | trashed (`{}`) |
| 9 | 1X_RnXGApyjNo56COeyh6XRS78zOlfgMz | cmukdh8bg000040vwk1831h1g | testreport | trashed (`{}`) |
| 10 | 1fwmRrDMO-2yCZwzJvbPz_csKuc2vrdrb | cmukf9w8p000014j5ypk5an5y | auftrag | trashed (`{}`) |
| 11 | 1soF3koxIQ1Q8mku-LvlB5o84kD_2q94j | cmukf9w8p000014j5ypk5an5y | workflow | trashed (`{}`) |
| 12 | 1p3gSbOlwvonHzvRYzl-nw_RfVKds6Ldi | cmukf9w8p000014j5ypk5an5y | testreport | trashed (`{}`) |
| 13 | 1rPDQQpmmhBj24xF-_mJ_E51bx3KlCTtR | cmukh1so40000grpzqt0wkkxa | auftrag | trashed (`{}`) |
| 14 | 18veoGenw8TmshrT-ZrnQZ1XPDe1WeLdJ | cmukh1so40000grpzqt0wkkxa | workflow | trashed (`{}`) |
| 15 | 1WDF1o12-cA4il8XPQJUgrVA_c9C2cRAO | cmukh1so40000grpzqt0wkkxa | testreport | trashed (`{}`) |
| 16 | 1o-W2iZv-I3Qg_U53dfsphuJvmRKBpDGC | cmukhkowl0000df1zq2on6q1n | auftrag | trashed (`{}`) |
| 17 | 196b4pE1Me4osb7DsSAFutZ_Cg8w1pyEp | cmukhkowl0000df1zq2on6q1n | workflow | trashed (`{}`) |
| 18 | 1LJz8BiJID043fNQQyyYsh78Dr_edpdFj | cmukhkowl0000df1zq2on6q1n | testreport | trashed (`{}`) |
| 19 | 1eZMR1NzuhtcZ87xJ5soAdK1QV9petmXr | cmukxjt4n0000nms2ev9254in | auftrag | trashed (`{}`) |
| 20 | 1WbaxurENTOXTthGknaQ2HlolXM8wMQvf | cmukxjt4n0000nms2ev9254in | workflow | trashed (`{}`) |
| 21 | 1crh_uLRH7MAPlSrdyAGEfq0kOvP9vvpv | cmukxjt4n0000nms2ev9254in | testreport | trashed (`{}`) |
| 22 | 1TZ0oMazIXCV-WicoFH4ET1sG7ZyD9VCv | cmul2mek40002nms26gjijbql | auftrag | trashed (`{}`) |
| 23 | 13EyQ_UCgX7wWeoXydh1M-czibOlnqiEB | cmul2mek40002nms26gjijbql | workflow | trashed (`{}`) |
| 24 | 1CUd7wnykpm7OVg5cDHWlqZvBwKkHE1sU | cmul2mek40002nms26gjijbql | testreport | trashed (`{}`) |
| 25 | 1Q3EW-urDW1lXNzzpPZuF_WY3_-DXPCJ4 | cmul2ywq20003nms2lp7tr3u1 | auftrag | trashed (`{}`) |
| 26 | 13ke78fbvwnNQJusP55aaCFc7dk3ve-MA | cmul2ywq20003nms2lp7tr3u1 | workflow | trashed (`{}`) |
| 27 | 1MtL5TTnHyyH4sMl5ogbisLwPFWOrmsxm | cmul2ywq20003nms2lp7tr3u1 | testreport | trashed (`{}`) |
| 28 | 17AQyTjnRNpeAm0c8irxNghQBq3cd061N | cmulwajfs0000xscchqsbr1cq | auftrag | trashed (`{}`) |
| 29 | 10j2oBKjQ1CVdECS0qFn4-xQPnmJZPezB | cmulwajfs0000xscchqsbr1cq | workflow | trashed (`{}`) |
| 30 | 1kyktowdL6iWAvReV5XAekHxJZ6A0Pf_K | cmulwajfs0000xscchqsbr1cq | testreport | trashed (`{}`) |
| 31 | 1qC9ZornJNWw4ji6JBFneR7ICbanZmbKc | cmun5u6ol000313vmesll7g72 | auftrag | trashed (`{}`) |
| 32 | 1eGtCmKxJk0Se58dCosW48N7iVz_-wjtp | cmun5u6ol000313vmesll7g72 | workflow | trashed (`{}`) |
| 33 | 1S1HiJu44egdvggq08enWIcSyMIKmU70T | cmun5u6ol000313vmesll7g72 | testreport | trashed (`{}`) |
| 34 | 19ugSSb_2YquU0gRGz1d2pwfs3UrGy5xX | cmun7tccd000413vmpqsxfd3t | auftrag | trashed (`{}`) |
| 35 | 1vxy58RaDFTz6DP6ZQGpv-KxMOqgEiHAL | cmun7tccd000413vmpqsxfd3t | workflow | trashed (`{}`) |
| 36 | 1Ud01g_c6haO3dCiNaAwRT7lajSJDxxmf | cmun7tccd000413vmpqsxfd3t | testreport | trashed (`{}`) |
| 37 | 1cZ0W0vfpqPYigNRIknPpyOHnFKvpPkgY | cmun7vi43000513vmstekhbie | auftrag | trashed (`{}`) |
| 38 | 1xeZF4628Xqrro3KPlrWSY5PzBF9IBHYw | cmun7vi43000513vmstekhbie | workflow | trashed (`{}`) |
| 39 | 1PuPrkzjF2LGXdoaUK0ri59PMkhKa9TP6 | cmun7vi43000513vmstekhbie | testreport | trashed (`{}`) |
| 40 | 1rZ2seCGUCvtz0BoC-WOEpg-edrQHRIrv | cmun9b5gc000613vmltmyi5r5 | auftrag | trashed (`{}`) |
| 41 | 17O2KEev00qML1-lRi1qpjay3oYriFiBF | cmun9b5gc000613vmltmyi5r5 | workflow | trashed (`{}`) |
| 42 | 1EYkiiCBffELSvPQMx8EEpQke2MW4zENj | cmun9b5gc000613vmltmyi5r5 | testreport | trashed (`{}`) |

Probe #1: danach Suche 0 Treffer, Metadaten „not found“ → Connector zeigt Papierkorb-Dateien nicht mehr an.

## Nachinventar 01–03 (live)
- 7 + 7 + 7 = 21 Dateien = exakt 5 Anker-Jobs × 3 + 2 UNKLAR-Jobs × 3 (Abgleich: True); 0 Batch-IDs verblieben.

## STOPP-Befund 04-FERTIG (nicht durch diesen Schritt verursacht)
- R-03a (vor Batch 1): 42 Dateien in 04-FERTIG gelistet.
- Nach Batch 1: Ordnersuche 0 Treffer; drive-weite Suche nach `FINAL_workflow` / `_documentation.md` 0 Treffer; Metadaten der Stichproben → „not found“.
- Ordner 04-FERTIG selbst vorhanden; `viewedByMeTime` 2026-09-30T18:08:48Z (UI-Zugriff des Kontoinhabers; API-Lesezugriffe aktualisieren diesen Wert nachweislich nicht, vgl. 03-TEST = 08:32Z trotz vieler API-Reads).
- Batch 1 enthielt keine 04-ID (Guard + Protokoll). ANNAHME: manuelle Entfernung über Drive-UI um ca. 18:08Z.
- Betroffen u. a. 10 **Evidence-Anker** (referenziert in FE `evidence/CRAFTFLOW_M1_RELEASE_MANIFEST_2026-09-29.md`):
| jobId | FINAL_workflow | documentation |
|---|---|---|
| cmulwh3nb0001xsccndho402e | 1LkJSWcwt0ESksXq5WWv9rmteNwPCTWuB | 1SE7v_VrgtxlBLFae5-9XBJVkcUkO7zK7 |
| cmulwnkjt0002xscc1hc4a5t2 | 1ruzOVN50lJ7EYHoxgUc9czK016ASMjC5 | 1gnlzldoxZzKHIMHNuAx8Kj87OiwQI81q |
| cmulwpe1b0003xscckkfy880h | 1zi7q5IwboyymQuU2c-FczEZVu6mApLdb | 1wSVFrSb3Cg-aE7CgEKIdgwJXUdhSHGmD |
| cmulwry8x0004xsccaofpjzhu | 1GSfeNWRGBhBxVYfPwRfA3EG1M-sLVyjn | 1YM-eoVyyss3YIJjX98AG0eNsa_V2ZeF9 |
| cmun9dco4000713vmm204gj8l | 14dVeezbqO9Ao43i3Mb9erGnJPj0MwLIX | 1Qqk3wryoht2H2pJc33XZQMMKTS0jhDYf |
