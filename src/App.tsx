import { lazy, Suspense } from "react";
import { MotionConfig } from "framer-motion";
import {
  AmbientNotificationCard,
  CostEstimateModule,
  IntentNode,
  ModuleStage,
  SpatialModelModule,
  SystemHeader,
} from "@/components/ui/index.ts";
import { useAmbientSimulation, useIntentInputFocus, useIntentRouter, useMetricsSampling } from "@/hooks/index.ts";
import { useSystemMetricsSnapshot } from "@/store/index.ts";

const NeuralTerrainCanvas = lazy(() => import("@/components/canvas/NeuralTerrainCanvas.tsx"));

function HeaderSlot() {
  const metrics = useSystemMetricsSnapshot();
  return <SystemHeader metrics={metrics} />;
}

function Workspace() {
  const router = useIntentRouter();
  const inputRef = useIntentInputFocus();

  return (
    <main className="relative mt-10 flex w-full flex-1 items-center justify-center">
      <IntentNode
        posture={router.posture}
        value={router.value}
        onValueChange={router.onValueChange}
        onSubmit={router.onSubmit}
        inputRef={inputRef}
      />
      <ModuleStage
        state={router.moduleState}
        onExitComplete={router.onModuleExitComplete}
        renderModule={(module) =>
          module.kind === "calculator" && router.costEstimate ? (
            <CostEstimateModule
              estimate={router.costEstimate}
              onClose={router.closeModule}
              onCommit={router.commitEstimate}
            />
          ) : (
            <SpatialModelModule onClose={router.closeModule} />
          )
        }
      />
    </main>
  );
}

function AmbientSlot() {
  const ambient = useAmbientSimulation();
  return <AmbientNotificationCard notification={ambient.notification} onAction={ambient.onAction} />;
}

export default function App() {
  useMetricsSampling();

  return (
    <MotionConfig reducedMotion="user">
      <Suspense fallback={null}>
        <NeuralTerrainCanvas />
      </Suspense>
      <div className="pointer-events-none relative z-10 flex min-h-dvh w-full flex-col p-6 md:p-12">
        <HeaderSlot />
        <Workspace />
      </div>
      <AmbientSlot />
    </MotionConfig>
  );
}
