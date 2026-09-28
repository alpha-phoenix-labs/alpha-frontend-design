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
      className="glass-panel pointer-events-auto relative flex h-[450px] max-h-[70vh] w-full max-w-[720px] flex-col rounded-[2rem] p-3"
    >
      <div className="absolute top-7 left-7 z-10 flex items-center gap-3">
        <div className="size-1.5 animate-pulse rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,.55)] motion-reduce:animate-none" aria-hidden="true" />
        <h2 id={titleId} className="font-mono text-[10px] font-medium tracking-widest text-indigo-600 uppercase">{title}</h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Modul schließen"
        className="absolute top-6 right-6 z-10 flex size-8 items-center justify-center rounded-xl border border-white/50 bg-white/80 text-slate-500 shadow-sm backdrop-blur-md transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
      >
        <CloseIcon className="size-4" />
      </button>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(145deg,#0F172A,#172554)] shadow-inner">
        {viewer ?? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ffffff_1px,transparent_1px)] bg-[length:24px_24px] opacity-15" aria-hidden="true" />
            <div className="z-10 text-center">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                <CubeIcon className="size-6 text-white/90" />
              </div>
              <p className="mb-1 text-sm font-medium text-white/80">Spatial Model Generated</p>
              <p className="font-mono text-[10px] text-white/40">Drag to interact</p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
