import type { ActiveModule, CostEstimate } from '@/types/index.ts';
import { REFERENCE_COST_ESTIMATE } from '@/mocks/costEstimate.ts';

/** Cost estimate for a calculator module; null for any other module kind. */
export function getCostEstimate(module: ActiveModule): CostEstimate | null {
  return module.kind === 'calculator' ? REFERENCE_COST_ESTIMATE : null;
}
