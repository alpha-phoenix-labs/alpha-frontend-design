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
    <header className="pointer-events-none flex items-start justify-between gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-2xl border border-indigo-100 bg-[linear-gradient(135deg,#EEF2FF,#FFFFFF)] shadow-[0_10px_30px_rgba(79,70,229,.10)]" aria-hidden="true">
            <div className="size-2.5 rounded-full bg-[linear-gradient(135deg,#4F46E5,#8B5CF6)] shadow-[0_0_16px_rgba(99,102,241,.45)]" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-[-0.02em] text-slate-950">{productName}</h1>
            <p className="mt-0.5 text-[11px] text-slate-400">Workflow production control</p>
          </div>
        </div>
        <div className="mt-2 ml-12 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[9px] tracking-[0.12em] text-slate-400 uppercase">
          <span>{metrics.edgeComputeActive ? "Edge Compute Active" : "Edge Compute Idle"}</span>
          <span className="text-slate-200" aria-hidden="true">•</span>
          <span>{runtimeLabel}</span>
        </div>
      </div>

      <div
        className="rounded-2xl border border-slate-100 bg-white/72 px-4 py-3 text-right font-mono text-[9px] tracking-[0.1em] text-slate-400 uppercase shadow-sm"
        role="group"
        aria-label="Systemstatus"
      >
        <div className="flex items-center justify-end gap-2">
          <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,.35)]" aria-hidden="true" />
          <span>{latencyFormat.format(metrics.latencyMs)}ms Latency</span>
        </div>
        <div className="mt-1">VRAM: {vramFormat.format(metrics.vramUsedGb)}GB / {memoryLabel}</div>
      </div>
    </header>
  );
}
