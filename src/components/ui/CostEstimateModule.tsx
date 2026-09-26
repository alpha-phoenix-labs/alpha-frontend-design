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
      className="glass-panel pointer-events-auto flex w-full max-w-[420px] flex-col gap-8 rounded-[2rem] p-6 sm:p-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <CalculatorIcon className="size-3.5 text-spatial-dim" />
          </div>
          <h2 id={titleId} className="text-xs font-medium tracking-wide text-spatial-dim">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Modul schließen"
          className="flex size-8 items-center justify-center rounded-full text-spatial-dim transition-colors hover:bg-white/5 hover:text-white focus-visible:bg-white/5 focus-visible:text-white focus-visible:outline-none"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div>
        <p className="mb-2 text-4xl font-light tracking-tight">{formatCents(estimate.totalCents, estimate.currency, 2)}</p>
        <p className="text-[11px] leading-relaxed text-spatial-dim">{estimate.note}</p>
      </div>

      <dl className="space-y-4">
        {estimate.lineItems.map((item, index) => {
          const isLast = index === estimate.lineItems.length - 1;
          return (
            <div
              key={`${item.category}-${index}`}
              className={`flex items-center justify-between text-sm ${isLast ? "pb-1" : "border-b border-white/5 pb-3"}`}
            >
              <dt className="font-light text-spatial-dim">
                {item.label}
                {item.estimatedHours !== undefined && (
                  <span className="ml-2 font-mono text-[10px] text-white/30">{hoursFormat.format(item.estimatedHours)} h</span>
                )}
              </dt>
              <dd className="font-medium">{formatCents(item.amountCents, estimate.currency, 0)}</dd>
            </div>
          );
        })}
      </dl>

      <button
        type="button"
        onClick={onCommit}
        className="mt-2 w-full rounded-2xl bg-white py-3.5 font-medium text-black shadow-[0_0_20px_rgb(255_255_255/0.15)] transition-all duration-300 hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-spatial-bg focus-visible:outline-none"
      >
        {commitLabel}
      </button>
    </section>
  );
}
