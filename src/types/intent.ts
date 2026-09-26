/** Intent categories recognised by the intent node (reference: "kosten|kostet|preis|kalk" → calculator, "3d|raum|bild" → spatialModel). */
export type IntentKind = 'calculator' | 'spatialModel';

/** All intent kinds in a stable order. */
export const INTENT_KINDS = ['calculator', 'spatialModel'] as const satisfies readonly IntentKind[];

/** Type guard for {@link IntentKind}. */
export function isIntentKind(value: unknown): value is IntentKind {
  return typeof value === 'string' && (INTENT_KINDS as readonly string[]).includes(value);
}

/** Posture of the intent node: centred while no module is open, receded (moved up, dimmed) while a module is shown. */
export type IntentNodePosture = 'idle' | 'receded';
