import type { CostEstimate } from '@/types/index.ts';

/** Cost estimate shown by the reference calculator module ("€ 4,250.00"). */
export const REFERENCE_COST_ESTIMATE: CostEstimate = {
  currency: 'EUR',
  totalCents: 425000,
  lineItems: [
    { category: 'materials', label: 'Materials', amountCents: 180000 },
    { category: 'labor', label: 'Labor', amountCents: 102000, estimatedHours: 12 },
    { category: 'marginBuffer', label: 'Margin & Buffer', amountCents: 143000 },
  ],
  note: 'Estimated via WebNN. Material costs projected against current live market data.',
};
