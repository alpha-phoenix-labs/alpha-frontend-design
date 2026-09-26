import type { WorkflowProductionMetrics } from '@/types/factory/index.ts';

/** Cost components that make up the total production cost, in micros. */
export type ProductionCostParts = Pick<WorkflowProductionMetrics, 'apiCostMicros' | 'platformCostMicros'>;

/** Total production cost (Gesamtproduktionskosten) in micros; the only valid source of `totalCostMicros`. */
export function totalProductionCostMicros(parts: ProductionCostParts): number {
  return parts.apiCostMicros + parts.platformCostMicros;
}
