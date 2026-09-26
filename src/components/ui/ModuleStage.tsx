import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import type { ActiveModule, ModuleState } from "@/types/index.ts";
import { moduleCardMotion } from "@/components/ui/motion.ts";

export interface ModuleStageProps {
  state: ModuleState;
  renderModule: (module: ActiveModule) => ReactNode;
  onExitComplete?: () => void;
}

export function ModuleStage({ state, renderModule, onExitComplete }: ModuleStageProps) {
  return (
    <div className="pointer-events-none flex h-full w-full max-w-6xl items-center justify-center gap-8">
      <AnimatePresence mode="wait" {...(onExitComplete ? { onExitComplete } : {})}>
        {state.status === "active" && (
          <motion.div
            key={state.module.id}
            className="flex w-full justify-center"
            variants={moduleCardMotion}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {renderModule(state.module)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
