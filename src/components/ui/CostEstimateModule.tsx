import { useId } from "react";
import type { CostEstimate } from "@/types/index.ts";
import { CalculatorIcon, CloseIcon } from "@/components/ui/icons.tsx";

export interface CostEstimateModuleProps {
  estimate: CostEstimate;
  onClose: () => void;
  onCommit: () => void;
  title?: string;
  commitLabel?: string;
}

const hoursFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

function formatCents(cents: number, currency: CostEstimate["currency"], fractionDigits: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(cents / 100);
}

export function CostEstimateModule({
  estimate,
  onClose,
  onCommit,
  title = "Inference Result",
  commitLabel = "Commit to Project",
}: CostEstimateModuleProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="glass-panel pointer-events-auto flex w-full max-w-[440px] flex-col gap-7 rounded-[22px] p-6 sm:p-7"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10">
            <CalculatorIcon className="size-3.5 text-indigo-300" />
          </div>
          <h2 id={titleId} className="text-[11px] font-semibold tracking-wide text-slate-300">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Modul schließen"
          className="flex size-8 items-center justify-center rounded-lg border border-[#1a2f50] bg-[#08172a] text-slate-500 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div>
        <p className="text-4xl font-semibold tracking-[-0.04em] text-white">{formatCents(estimate.totalCents, estimate.currency, 2)}</p>
        <p className="mt-2 text-[10px] leading-5 text-slate-500">{estimate.note}</p>
      </div>

      <dl className="space-y-3">
        {estimate.lineItems.map((item, index) => (
          <div key={`${item.category}-${index}`} className="flex items-center justify-between border-b border-[#14243f] pb-3 text-[11px] last:border-0">
            <dt className="text-slate-500">
              {item.label}
              {item.estimatedHours !== undefined && (
                <span className="ml-2 font-mono text-[8px] text-slate-600">{hoursFormat.format(item.estimatedHours)} h</span>
              )}
            </dt>
            <dd className="font-semibold text-slate-200">{formatCents(item.amountCents, estimate.currency, 0)}</dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={onCommit}
        className="w-full rounded-xl bg-[linear-gradient(90deg,#4338CA,#4F46E5)] py-3 text-[11px] font-semibold text-white shadow-[0_0_22px_rgba(79,70,229,.25)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
      >
        {commitLabel}
      </button>
    </section>
  );
}
