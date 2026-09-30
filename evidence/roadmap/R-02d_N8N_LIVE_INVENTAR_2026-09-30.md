# R-02d – n8n Live-Inventar (read-only, API) – ENTWURF

Stand: 2026-09-30T17:51:30Z · Roadmap Punkt 2/20
Quelle: GitHub Actions Run 36752507546 (Attempt 2), Job 110020745677, BE-Branch ops/r-02d-n8n-readonly-inventory-20260930 @ 6e34c47
Methode: ausschließlich GET /api/v1/workflows, /api/v1/executions, /api/v1/workflows/{id}
Human Gate: keine Änderung an n8n durch diesen Lauf; kein Render-Deploy (Branch ≠ main)

## Ergebnis
- WORKFLOWS total=33 (alle active=false, archived=false) → **keine Workflow-Löschung erfolgt**
- EXECUTIONS total=0 → **alle Executions entfernt** (Screenshot 18:35 lokal zeigte noch ≥10). Ursache: NICHT BELEGT (ANNAHME: manuelle Löschung im Executions-Tab)
- Evidence-Anker (Workflows): 5/5 vorhanden (HTTP 200)
- Evidence-Anker (Executions 21, 22, 23, 24, 29): **nicht mehr vorhanden** (Execution 29 = release-definierend, Run 36640752286)
- Kategorie A: 16/16 vorhanden; ID ↔ Namenssuffix für alle 16 bestätigt (Kriterium b erfüllt)

## Vollinventar (ID → Name-Suffix / Kategorie)
| ID | Name (Kurz) | created (UTC) | Kategorie |
|---|---|---|---|
| qmMoOMD511LTPhtt | Minimal E2E Test Workflow · cmuh65gdm000 | 2026-09-25T16:22 | A |
| NvLdMdZ8HJXJBSfV | Minimal Response Workflow · cmuk5puc8000 | 2026-09-27T18:33 | A |
| tRClfK9r2Z3DZDr3 | Simple Workflow · cmukb7kma000 | 2026-09-27T21:10 | A |
| Ctw8rBsgQpYA2oCp | Minimal Webhook Response · cmukdh8bg000 | 2026-09-27T22:10 | A |
| QxYKwuAYerhW4YCb | Minimal JSON Response Workflow · cmukf9w8p000 | 2026-09-27T23:01 | A |
| K7FKTz89WHzGKYNw | Minimal Workflow · cmukh1so4000 | 2026-09-27T23:50 | A |
| lFtFFqbYviqOb0o0 | Email workflow mit priority · cmukh5ylt000 | 2026-09-27T23:54 | A |
| oSnbC2zK1UOvHA8j | Minimal Workflow · cmukhkowl000 | 2026-09-28T00:05 | A |
| dQz7P5icvnj03Wxs | Webhook to JSON Response · cmukxjt4n000 | 2026-09-28T07:32 | A |
| AdNHGWfMNCdo0ZXF | Minimal Webhook Workflow · cmul2mek4000 | 2026-09-28T09:54 | A |
| PImYct4CrP6f5Wk4 | Minimal Workflow · cmul2ywq2000 | 2026-09-28T10:04 | A |
| Q2qF7XbR1A9N82Md | Webhook Response Workflow · cmulwajfs000 | 2026-09-28T23:45 | A |
| N3xoZrZB315jZR1i | Webhook Response Workflow · cmun5u6ol000 | 2026-09-29T21:00 | A |
| tjmgN2h9lnhVVaCT | Webhook Response Workflow · cmun7tccd000 | 2026-09-29T21:55 | A |
| Hz3bXcsGhzKxocRa | Webhook Response Workflow · cmun7vi43000 | 2026-09-29T21:57 | A |
| jBBT1QVJtYAVCFmx | Webhook Response Workflow · cmun9b5gc000 | 2026-09-29T22:37 | A |
| pniunvHXh0Y2ZJtU | TEMP PR36 webhook registration diagnostic | 2026-09-28T23:36 | D |
| RTTB5xViy6iI3dt7 | TEMP PR36 webhook registration diagnostic | 2026-09-28T23:36 | D |
| qqIKS7MbuaZbBQ9n | Webhook Response Workflow · cmulwh3nb000 | 2026-09-28T23:50 | B (Anker) |
| bBfZCFELgcHkSTFF | Webhook Response Workflow · cmulwnkjt000 | 2026-09-28T23:55 | B (Anker) |
| iZOuDOeXqXdAGKj9 | Webhook Response Workflow · cmulwpe1b000 | 2026-09-28T23:56 | B (Anker) |
| A11gX6i1Nh7ISN06 | Webhook Response Workflow · cmulwry8x000 | 2026-09-28T23:58 | B (Anker) |
| B3AAGdSdABVK8oAC | Webhook Response Workflow · cmun9dco4000 | 2026-09-29T22:39 | B (Anker, Release) |
| AssJPAYqSpVM0C0F | Minimal Workflow · cmuk0jjj2000 | 2026-09-27T16:10 | C (UNKLAR) |
| nXWTnCpYbWwZa6Xy | Minimal Webhook Response Workflow · cmuk0wgwc000 | 2026-09-27T16:19 | C (UNKLAR) |
| 7qDvBNuUMSNg3qD6 | Email Prioritization Workflow · cmukh4sz1000 | 2026-09-27T23:53 | C (UNKLAR, bisher „F“) |
| V13zufOg2RD2JBtd | Minimal n8n Workflow · cmul2gk3i000 | 2026-09-28T09:51 | C (UNKLAR) |
| hnR9SpcALS5752bq | Webhook Response Workflow · cmuloyms9000 | 2026-09-28T20:20 | C (UNKLAR) |
| uFmPKUFwWEpCY3EL | Webhook Response Workflow · cmuls94u0000 | 2026-09-28T21:52 | C (UNKLAR) |
| FRf5CUhICeB78zV3 | Webhook Response Workflow · cmult0gal000 | 2026-09-28T22:13 | C (UNKLAR) |
| SMA7VAd1qbI2BXJq | Webhook Response Workflow · cmuluxjai000 | 2026-09-28T23:07 | C (UNKLAR) |
| 2HRwNqSmBfuRMBwc | VantomLabs SHK Kundenanfrage-Assistent v1.1 | 2026-09-23T08:53 | E (nie anfassen) |
| u1BHUlVbltZXEwq0 | Agent Swarm | 2026-09-24T08:55 | E (nie anfassen) |

Summe: A 16 + D 2 + B 5 + C 8 + E 2 = 33 ✓ (F aufgelöst → C)
