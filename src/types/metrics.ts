import type { IsoTimestamp } from '@/types/common.ts';

/** Engine status shown in the system header ("0.4ms Latency", "VRAM: 0.80GB / Unified", "Edge Compute Active", "Local SLM"). */
export interface SystemMetrics {
  /** Inference latency in milliseconds. */
  readonly latencyMs: number;
  /** Used video memory in gigabytes. */
  readonly vramUsedGb: number;
  readonly memoryArchitecture: 'unified';
  readonly edgeComputeActive: boolean;
  readonly inferenceRuntime: 'localSlm';
  readonly sampledAt: IsoTimestamp;
}
