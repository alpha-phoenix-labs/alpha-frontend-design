import type { IsoTimestamp } from '@/types/common.ts';

/** Data streams an ambient task can originate from (reference: voice memo; philosophy: email, webhook, WhatsApp). */
export type AmbientSource = 'voiceMemo' | 'email' | 'webhook' | 'whatsapp';

/** Actions offered on an ambient notification card ("Dismiss", "Review Draft"). */
export type AmbientActionKind = 'dismiss' | 'review';

/** A single action button on an ambient notification. */
export interface AmbientAction {
  readonly kind: AmbientActionKind;
  readonly label: string;
}

/** Proactive notification raised by background work, asking the human to approve or dismiss. */
export interface AmbientNotification {
  readonly id: string;
  readonly source: AmbientSource;
  readonly title: string;
  readonly message: string;
  readonly createdAt: IsoTimestamp;
  readonly actions: readonly AmbientAction[];
}
