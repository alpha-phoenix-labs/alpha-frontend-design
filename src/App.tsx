import { lazy, Suspense, useCallback } from "react";
import { MotionConfig } from "framer-motion";
import {
  AmbientNotificationCard,
  CostEstimateModule,
  FactoryWorkflowModule,
  IntentNode,
  ModuleStage,
  SpatialModelModule,
  SystemHeader,
} from "@/components/ui/index.ts";
import {
  useAmbientSimulation,
  useIntentInputFocus,
  useIntentRouter,
  useMetricsSampling,
  useSpectreFactoryIntegration,
} from "@/hooks/index.ts";
import { useSystemMetricsSnapshot } from "@/store/index.ts";

const NeuralTerrainCanvas = lazy(() => import("@/components/canvas/NeuralTerrainCanvas.tsx"));

function HeaderSlot() {
  const metrics = useSystemMetricsSnapshot();
  return <SystemHeader metrics={metrics} />;
}

function Workspace() {
  const router = useIntentRouter();
  const factory = useSpectreFactoryIntegration();
  const inputRef = useIntentInputFocus();
  const factoryVisible = factory.activeJobId !== null || factory.lastError !== null;

  const handleSubmit = useCallback(
    (value: string) => {
      if (factory.activeJobId === null) {
        const localKind = router.onSubmit(value);
        if (localKind !== null) {
          return;
        }
      }

      void factory.submitPrompt(value).then((submitted) => {
        if (submitted) {
          router.onValueChange("");
        }
      });
    },
    [factory, router],
  );

  return (
    <main className="relative mt-10 flex w-full flex-1 items-center justify-center">
      <IntentNode
        posture={factoryVisible ? "receded" : router.posture}
        value={router.value}
        onValueChange={router.onValueChange}
        onSubmit={handleSubmit}
        inputRef={inputRef}
        placeholder="Describe the workflow you want Craftflow to build"
      />

      {factoryVisible ? (
        <div className="pointer-events-none flex h-full w-full max-w-6xl items-center justify-center gap-8 pt-48">
          <div className="relative z-10 flex w-full justify-center">
            <FactoryWorkflowModule
              activeJobId={factory.activeJobId}
              job={factory.activeJob}
              gate={factory.humanGate}
              testReport={factory.testReport}
              lastError={factory.lastError}
              clarificationDraft={factory.clarificationDraft}
              onClarificationDraftChange={factory.setClarificationDraft}
              onSubmitClarification={factory.submitClarification}
              approvalVersion={factory.approvalVersion}
              approvalConflict={factory.approvalConflict}
              onApproval={factory.submitApproval}
              clarificationBusy={factory.clarificationBusy}
              approvalBusy={factory.approvalBusy}
              mutationUnconfirmed={factory.mutationUnconfirmed}
              recoveryBusy={factory.recoveryBusy}
              onRecoverMutation={factory.recoverMutation}
            />
          </div>
        </div>
      ) : (
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
      )}
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
