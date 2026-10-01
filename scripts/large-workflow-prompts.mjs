// R-08: realistic Craftflow test orders for Roadmap Punkt 8 (große Workflows).
// Order of execution is binding: 20 → 40 → 60 → 80 → 100 nodes (BOSS, 2026-10-01).
import {pathToFileURL} from 'node:url';

export const STAGES = Object.freeze([20, 40, 60, 80, 100]);

const SANDBOX_RULES = [
  'Technische Rahmenbedingungen:',
  '- Genau ein Auslöser: Webhook (POST, JSON), Antwortmodus lastNode, der am Ende eine JSON-Antwort mit ok=true und einer Zusammenfassung liefert.',
  '- Keine Zugangsdaten, keine dynamischen URLs, keine externen Dienste direkt aufrufen.',
  '- Externe Systeme (Kalender, E-Mail, SMS, Buchhaltung, Telematik) werden als fachlich vollständige, vorbereitete Daten- bzw. Nachrichtenobjekte modelliert (z. B. "E-Mail an Kundin vorbereiten" mit Betreff, Text, Empfängerfeld).',
  '- Jeder Node hat einen eigenen, sprechenden deutschen Namen und eine eigene fachliche Aufgabe; keine kopierten Platzhalter-Nodes.',
  '- Die Nodes sind als durchgehende Kette verbunden, sodass ein Testaufruf alle Schritte ausführt.',
].join('\n');

const ORDERS = {
  20: {
    branch: 'Friseur / Beauty',
    flow: 'Online-Termin → Verfügbarkeit → Buchung → Bestätigung → Erinnerung → Bewertungsanfrage',
    detail: [
      'Ein Friseursalon nimmt Online-Terminanfragen an (Kundin, Telefon, E-Mail, gewünschte Leistung wie Schnitt, Farbe oder Strähnen, Wunschdatum, Wunschzeit, Stylistin).',
      'Schritte: Anfrage annehmen und Pflichtfelder prüfen; Leistung der Dauer und dem Preis zuordnen; Öffnungszeiten prüfen; Verfügbarkeit der Stylistin prüfen; Ersatztermin vorschlagen, falls belegt; Buchung anlegen; Buchungsnummer erzeugen;',
      'Bestätigung per E-Mail und SMS vorbereiten; Kalendereintrag vorbereiten; Erinnerung 24 Stunden vorher planen; Storno-Link vorbereiten; Hinweis zur Anzahlung bei Farbbehandlungen;',
      'nach dem Termin Bewertungsanfrage vorbereiten; Stammkundenstatus aktualisieren; Tagesliste des Salons ergänzen; Antwort an das Buchungsformular zusammenstellen.',
    ],
  },
  40: {
    branch: 'Gastronomie',
    flow: 'Reservierung → Tischprüfung → Bestätigung → Änderung/Storno → Reminder → Review → Tagesübersicht',
    detail: [
      'Ein Restaurant verarbeitet Tischreservierungen (Gast, Personenzahl, Datum, Uhrzeit, Bereich innen/Terrasse, Anlass, Allergien, Kinderstuhl).',
      'Schritte unter anderem: Eingang validieren; Öffnungs- und Ruhetage prüfen; Gruppengröße einordnen; Tischplan abgleichen; Tische kombinieren; Wartelisten-Logik; Allergien an die Küche markieren; Anlass (Geburtstag, Firmenfeier) vermerken;',
      'Bestätigung per E-Mail und SMS vorbereiten; Änderungs- und Stornoregeln (Fristen, No-Show-Gebühr) abbilden; Erinnerung am Vortag; Bewertungsanfrage am Folgetag; Gästeprofil aktualisieren;',
      'Tagesübersicht für Service und Küche (Belegung je Zeitslot, Sonderwünsche, Gruppen) zusammenstellen; Kennzahlen für die Woche fortschreiben.',
    ],
  },
  60: {
    branch: 'SHK / Elektro / Maler',
    flow: 'Kundenanfrage → KI-Auswertung → Dringlichkeit → Termin → Angebot → Freigabe → Auftrag → Rechnung → Nachfassen',
    detail: [
      'Ein Handwerksbetrieb (Sanitär-Heizung-Klima, Elektro, Maler) bearbeitet Kundenanfragen (Kontakt, Adresse, Gewerk, Problembeschreibung, Fotos-Hinweis, Wunschzeitraum).',
      'Schritte unter anderem: Anfrage normalisieren; Gewerk erkennen; Schlagworte für Notfälle (Wasserschaden, Heizungsausfall, Stromausfall) auswerten; Dringlichkeit einstufen; Einsatzgebiet und Anfahrtszone bestimmen;',
      'Termin für Besichtigung vorschlagen; Material- und Arbeitszeitschätzung; Angebot mit Positionen, Lohn, Material, Anfahrt, MwSt. erstellen; Freigabe durch den Meister vorbereiten; Auftragsbestätigung;',
      'Einsatzplanung; Arbeitsbericht; Rechnung mit Zahlungsziel; Zahlungseingang prüfen; Nachfassen bei offenen Angeboten und Rechnungen; Wartungserinnerung für das Folgejahr.',
    ],
  },
  80: {
    branch: 'Dachdecker / Tischler / GaLa',
    flow: 'Lead → Bilder/Dokumente → Bedarfsermittlung → Kalkulation → Angebot → Material → Terminplanung → Mitarbeiter → Abnahme → Rechnung → Bewertung',
    detail: [
      'Ein Betrieb für Dach, Holz oder Garten- und Landschaftsbau verarbeitet Projekt-Leads (Kontakt, Objektadresse, Projektart, Maße, Fotos und Pläne als Dokumentliste, Budget, Wunschtermin).',
      'Schritte unter anderem: Lead-Qualifizierung; Dokumentenliste prüfen und fehlende Unterlagen anfordern; Aufmaß und Bedarfsermittlung; Kalkulation je Gewerk mit Material, Lohn, Gerät, Entsorgung, Gerüst bzw. Maschinen;',
      'Angebot in Varianten; Nachkalkulationsreserve; Materialbestellung vorbereiten und Liefertermine; Wetter- und Saisonprüfung; Terminplanung; Kolonnen- und Mitarbeiterzuteilung mit Qualifikationen;',
      'Baustellenmappe; Zwischenabnahmen; Mängelliste; Endabnahme mit Protokoll; Abschlags- und Schlussrechnung; Gewährleistungsfristen; Bewertungsanfrage; Referenzprojekt-Eintrag.',
    ],
  },
  100: {
    branch: 'Spedition',
    flow: 'Auftrag → Kundendaten → Tour/Fahrer → Dokumente → Status → ETA → Kundenbenachrichtigungen → Abweichungen → POD → Rechnung → Mahnung → Reporting',
    detail: [
      'Eine Spedition verarbeitet Transportaufträge (Auftraggeber, Lade- und Entladestelle, Zeitfenster, Sendungsdaten, Gewicht, Lademeter, Gefahrgut-Kennzeichen, Kühlung).',
      'Schritte unter anderem: Auftrag validieren; Kundendaten und Rahmenvertrag abgleichen; Preisermittlung; Tourenplanung; Fahrzeug- und Fahrerzuteilung mit Lenkzeiten; Dokumente (CMR, Lieferschein, Gefahrgutpapiere) vorbereiten;',
      'Statusmeldungen (geladen, unterwegs, zugestellt); ETA-Berechnung; Kundenbenachrichtigungen; Abweichungsmanagement (Verspätung, Schaden, Teillieferung); Ablieferbeleg (POD) prüfen;',
      'Rechnung mit Zuschlägen (Maut, Diesel, Wartezeit); Zahlungsüberwachung; Mahnstufen; Gutschriften; Kennzahlen-Reporting (Pünktlichkeit, Auslastung, Umsatz je Kunde).',
    ],
  },
};

export function largeWorkflowPrompt(stage, correlationId) {
  const order = ORDERS[stage];
  if (!order) throw new Error('STAGE_NOT_ALLOWED');
  if (typeof correlationId !== 'string' || !/^[A-Za-z0-9._-]{1,128}$/.test(correlationId)) throw new Error('INVALID_CORRELATION_ID');
  const text = [
    `Correlation ID ${correlationId}.`,
    `Erstelle einen realistischen n8n-Workflow für einen Betrieb der Branche ${order.branch} mit genau ${stage} Nodes (inklusive Auslöser).`,
    `Fachlicher Ablauf: ${order.flow}.`,
    ...order.detail,
    SANDBOX_RULES,
  ].join('\n');
  if (text.length > 8000) throw new Error('PROMPT_TOO_LONG');
  return text;
}

// CLI: node scripts/large-workflow-prompts.mjs <stage> <correlationId>
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.stdout.write(largeWorkflowPrompt(Number(process.argv[2]), process.argv[3]));
}
