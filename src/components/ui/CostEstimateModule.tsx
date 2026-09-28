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
      className="glass-panel pointer-events-auto flex w-full max-w-[440px] flex-col gap-8 rounded-[2rem] p-6 sm:p-8"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50">
            <CalculatorIcon className="size-3.5 text-indigo-600" />
          </div>
          <h2 id={titleId} className="text-xs font-semibold tracking-wide text-slate-500">{title}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Modul schließen"
          className="flex size-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div>
        <p className="mb-2 text-4xl font-semibold tracking-[-0.04em] text-slate-950">{formatCents(estimate.totalCents, estimate.currency, 2)}</p>
        <p className="text-[11px] leading-relaxed text-slate-500">{estimate.note}</p>
      </div>

      <dl className="space-y-4">
        {estimate.lineItems.map((item, index) => {
          const isLast = index === estimate.lineItems.length - 1;
          return (
            <div
              key={`${item.category}-${index}`}
              className={`flex items-center justify-between text-sm ${isLast ? "pb-1" : "border-b border-slate-100 pb-3"}`}
            >
              <dt className="font-normal text-slate-500">
                {item.label}
                {item.estimatedHours !== undefined && (
                  <span className="ml-2 font-mono text-[10px] text-slate-400">{hoursFormat.format(item.estimatedHours)} h</span>
                )}
              </dt>
              <dd className="font-semibold text-slate-900">{formatCents(item.amountCents, estimate.currency, 0)}</dd>
            </div>
          );
        })}
      </dl>

      <button
        type="button"
        onClick={onCommit}
        className="mt-2 w-full rounded-2xl bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] py-3.5 font-semibold text-white shadow-[0_14px_32px_rgba(79,70,229,.22)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
      >
        {commitLabel}
      </button>
    </section>
  );
}
