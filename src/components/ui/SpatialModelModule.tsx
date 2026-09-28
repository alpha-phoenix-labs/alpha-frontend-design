import { useId } from "react";
import type { ReactNode } from "react";
import { CloseIcon, CubeIcon } from "@/components/ui/icons.tsx";

export interface SpatialModelModuleProps {
  onClose: () => void;
  title?: string;
  viewer?: ReactNode;
}

export function SpatialModelModule({ onClose, title = "Gaussian Splat Render", viewer }: SpatialModelModuleProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="glass-panel pointer-events-auto relative flex h-[450px] max-h-[70vh] w-full max-w-[720px] flex-col rounded-[22px] p-3"
    >
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
        <span className="size-1.5 animate-pulse rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,.7)] motion-reduce:animate-none" />
        <h2 id={titleId} className="font-mono text-[9px] font-semibold tracking-[0.14em] text-indigo-300 uppercase">{title}</h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Modul schließen"
        className="absolute top-5 right-5 z-10 flex size-8 items-center justify-center rounded-lg border border-[#1a2f50] bg-[#08172a]/90 text-slate-500 backdrop-blur transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
      >
        <CloseIcon className="size-4" />
      </button>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-[16px] border border-[#152945] bg-[#040a14] shadow-inner">
        {viewer ?? (
          <>
            <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle,#60A5FA_1px,transparent_1px)] [background-size:22px_22px]" />
            <div className="z-10 text-center">
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
                <CubeIcon className="size-6 text-indigo-300" />
              </div>
              <p className="text-[12px] font-medium text-slate-300">Spatial Model Generated</p>
              <p className="mt-1 font-mono text-[8px] text-slate-600">Drag to interact</p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
