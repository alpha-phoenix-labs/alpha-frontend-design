import type { SystemMetrics } from "@/types/index.ts";

export interface SystemHeaderProps {
  metrics: SystemMetrics;
  productName?: string;
}

const latencyFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const vramFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function SystemHeader({ metrics, productName = "Craftflow" }: SystemHeaderProps) {
  const runtimeLabel = metrics.inferenceRuntime === "localSlm" ? "Local SLM" : metrics.inferenceRuntime;
  const memoryLabel = metrics.memoryArchitecture === "unified" ? "Unified" : metrics.memoryArchitecture;

  return (
    <header className="pointer-events-none flex items-start justify-between gap-6 opacity-80">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex size-6 items-center justify-center rounded-md border border-white/20 bg-white/10" aria-hidden="true">
            <div className="size-2 rounded-full bg-white" />
          </div>
          <h1 className="text-lg font-medium tracking-wide">{productName}</h1>
        </div>
        <div className="mt-1 ml-9 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] tracking-widest text-spatial-dim uppercase">
          <span>{metrics.edgeComputeActive ? "Edge Compute Active" : "Edge Compute Idle"}</span>
          <span className="opacity-50" aria-hidden="true">
            |
          </span>
          <span>{runtimeLabel}</span>
        </div>
      </div>

      <div
        className="flex flex-col items-end gap-1 text-right font-mono text-[9px] tracking-widest text-spatial-dim uppercase"
        role="group"
        aria-label="Systemstatus"
      >
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-emerald-400/50" aria-hidden="true" />
          <span>{latencyFormat.format(metrics.latencyMs)}ms Latency</span>
        </div>
        <div>
          VRAM: {vramFormat.format(metrics.vramUsedGb)}GB / {memoryLabel}
        </div>
      </div>
    </header>
  );
}
