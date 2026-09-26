import type { IsoTimestamp } from '@/types/common.ts';
import type { IntentKind } from '@/types/intent.ts';

/** A module spawned from a recognised intent. The reference shows at most one module at a time. */
export interface ActiveModule {
  readonly id: string;
  readonly kind: IntentKind;
  /** Raw intent text that spawned the module. */
  readonly intentText: string;
  readonly openedAt: IsoTimestamp;
}

/** Module stage state: either empty (intent node idle) or showing exactly one module. */
export type ModuleState =
  | { readonly status: 'idle' }
  | { readonly status: 'active'; readonly module: ActiveModule };

/** Cost line categories of the calculator module (Materials, Labor, Margin & Buffer). */
export type CostLineCategory = 'materials' | 'labor' | 'marginBuffer';

/** One line of a cost estimate. Amounts are integer euro cents. */
export interface CostLineItem {
  readonly category: CostLineCategory;
  readonly label: string;
  readonly amountCents: number;
  /** Estimated hours, only for labor lines ("Labor (Est. 12h)"). */
  readonly estimatedHours?: number;
}

/** Content of the calculator module ("Inference Result"). */
export interface CostEstimate {
  readonly currency: 'EUR';
  readonly totalCents: number;
  readonly lineItems: readonly CostLineItem[];
  /** Explanatory note shown under the total. */
  readonly note: string;
}
