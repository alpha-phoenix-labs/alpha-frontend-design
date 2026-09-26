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
      className="glass-panel pointer-events-auto relative flex h-[450px] max-h-[70vh] w-full max-w-[700px] flex-col rounded-[2rem] p-3"
    >
      <div className="absolute top-7 left-7 z-10 flex items-center gap-3">
        <div
          className="size-1.5 animate-pulse rounded-full bg-white shadow-[0_0_10px_rgb(255_255_255/0.8)] motion-reduce:animate-none"
          aria-hidden="true"
        />
        <h2 id={titleId} className="font-mono text-[10px] tracking-widest text-spatial-accent uppercase">
          {title}
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Modul schließen"
        className="absolute top-6 right-6 z-10 flex size-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/70 backdrop-blur-md transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
      >
        <CloseIcon className="size-4" />
      </button>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/5 bg-[#0a0a0c] shadow-inner">
        {viewer ?? (
          <>
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ffffff_1px,transparent_1px)] bg-[length:24px_24px] opacity-20"
              aria-hidden="true"
            />
            <div className="z-10 text-center">
              <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <CubeIcon className="size-6 text-white/80" />
              </div>
              <p className="mb-1 text-sm font-light text-spatial-dim">Spatial Model Generated</p>
              <p className="font-mono text-[10px] text-white/30">Drag to interact</p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
