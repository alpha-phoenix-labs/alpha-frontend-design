import { describe, expect, it } from 'vitest';
import { LOCAL_INTENT_MAX_CHARS, routeIntent } from './useIntentRouter.ts';
// @ts-expect-error -- plain ESM script without type declarations
import { STAGES, largeWorkflowPrompt } from '../../scripts/large-workflow-prompts.mjs';

describe('routeIntent', () => {
  it('opens local modules for short commands', () => {
    expect(routeIntent('kosten')).toBe('calculator');
    expect(routeIntent('Was kostet das?')).toBe('calculator');
    expect(routeIntent('Preis')).toBe('calculator');
    expect(routeIntent('3d')).toBe('spatialModel');
    expect(routeIntent('Raum zeigen')).toBe('spatialModel');
    expect(routeIntent('Hallo')).toBeNull();
  });

  it('never intercepts a longer factory order, even with keywords (R-08 stage 1 root cause)', () => {
    const order = 'Erstelle einen Workflow, der Leistung, Dauer und Preis einer Buchung zuordnet und eine Kalkulation erzeugt.';
    expect(order.length).toBeGreaterThan(LOCAL_INTENT_MAX_CHARS);
    expect(routeIntent(order)).toBeNull();
  });

  it('routes every realistic stage order and the standard E2E prompt to the factory', () => {
    for (const stage of STAGES as number[]) {
      expect(routeIntent(largeWorkflowPrompt(stage, `craftflow-large-1-1-n${stage}`) as string)).toBeNull();
    }
    expect(routeIntent('Create a minimal n8n workflow that receives a webhook POST with JSON and returns a JSON response containing ok=true. No external services, no credentials, no dynamic URLs.')).toBeNull();
  });

  it('applies the length limit to trimmed text only', () => {
    expect(routeIntent(`   kosten${' '.repeat(60)}`)).toBe('calculator');
    expect(routeIntent('k'.repeat(LOCAL_INTENT_MAX_CHARS) + ' kosten')).toBeNull();
  });
});
