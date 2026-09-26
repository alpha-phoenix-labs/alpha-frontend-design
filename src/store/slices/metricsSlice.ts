import type { StateCreator } from 'zustand';
import type { SystemMetrics } from '@/types/index.ts';
import type { CraftflowState } from '@/store/craftflowState.ts';

/** Measured values of one metrics sample; the remaining fields are static engine properties. */
export type MetricsSample = Pick<SystemMetrics, 'latencyMs' | 'vramUsedGb'>;

/** Latest system metrics snapshot shown in the system header. */
export interface MetricsSlice {
  readonly metrics: SystemMetrics;
  readonly recordMetricsSample: (sample: MetricsSample) => void;
}

/** Reference start values: "0.4ms Latency", "VRAM: 0.8GB / Unified", "Edge Compute Active", "Local SLM". */
export const INITIAL_METRICS_SAMPLE: MetricsSample = { latencyMs: 0.4, vramUsedGb: 0.8 };

export const createMetricsSlice: StateCreator<CraftflowState, [], [], MetricsSlice> = (set) => ({
  metrics: {
    ...INITIAL_METRICS_SAMPLE,
    memoryArchitecture: 'unified',
    edgeComputeActive: true,
    inferenceRuntime: 'localSlm',
    sampledAt: new Date().toISOString(),
  },
  recordMetricsSample: (sample) =>
    set((state) => ({
      metrics: { ...state.metrics, ...sample, sampledAt: new Date().toISOString() },
    })),
});
