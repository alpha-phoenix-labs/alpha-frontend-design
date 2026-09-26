# Security Boundary

Dieses Repository ist bewusst vom produktiven CRAFTFLOW-Source-Code getrennt.

Erlaubt:
- Frontend-Komponenten
- Design-Tokens
- Mock-Daten
- freigegebene Typen und Schnittstellen
- Test- und Auditberichte

Nicht erlaubt:
- produktiver Backend-Source-Code
- Secrets oder .env-Inhalte
- Zugangsdaten
- private Schlüssel
- produktive Kundendaten
- Kopien anderer interner Repositories

Wenn für eine Aufgabe Informationen aus einem geschützten Repository benötigt werden, muss der Agent stoppen und ein Human Gate auslösen.
