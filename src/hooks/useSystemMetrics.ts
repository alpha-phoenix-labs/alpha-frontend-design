import { useEffect } from 'react';
import type { SystemMetrics } from '@/types/index.ts';
import type { MetricsSample } from '@/store/index.ts';
import { useMetricsActions, useSystemMetricsSnapshot } from '@/store/index.ts';

/** Sampling interval from the reference (3 s). */
export const SYSTEM_METRICS_INTERVAL_MS = 3000;
/** VRAM range of the reference in gigabytes. */
export const VRAM_RANGE_GB = { min: 0.8, max: 1.0 } as const;
/** Latency shown by the reference in milliseconds. */
export const REFERENCE_LATENCY_MS = 0.4;

/** Produces one simulated sample: VRAM uniformly in 0.80–1.00 GB (two decimals), constant latency. */
export function simulateMetricsSample(random: () => number = Math.random): MetricsSample {
  const vram = VRAM_RANGE_GB.min + random() * (VRAM_RANGE_GB.max - VRAM_RANGE_GB.min);
  return { latencyMs: REFERENCE_LATENCY_MS, vramUsedGb: Math.round(vram * 100) / 100 };
}

export interface SystemMetricsOptions {
  readonly enabled?: boolean;
  readonly intervalMs?: number;
}

/** Runs the metrics simulation without subscribing to the values (no re-renders). */
export function useMetricsSampling(options: SystemMetricsOptions = {}): void {
  const { enabled = true, intervalMs = SYSTEM_METRICS_INTERVAL_MS } = options;
  const { recordMetricsSample } = useMetricsActions();

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const timer = setInterval(() => recordMetricsSample(simulateMetricsSample()), intervalMs);
    return () => clearInterval(timer);
  }, [enabled, intervalMs, recordMetricsSample]);
}

/** Runs the metrics simulation and returns the current snapshot (re-renders every sample). */
export function useSystemMetrics(options: SystemMetricsOptions = {}): SystemMetrics {
  useMetricsSampling(options);
  return useSystemMetricsSnapshot();
}
