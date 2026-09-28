import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import {
  AmbientNotificationCard,
  CostEstimateModule,
  FactoryWorkflowModule,
  IntentNode,
  LoginScreen,
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
import { normalizeFactoryBaseUrl } from "@/services/factory/index.ts";
import { useSystemMetricsSnapshot } from "@/store/index.ts";
import type { AuthState } from "@/types/auth.ts";

const NeuralTerrainCanvas = lazy(() => import("@/components/canvas/NeuralTerrainCanvas.tsx"));
const WORKSPACE_PLACEHOLDER = "Describe the workflow you want Craftflow to build";

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
    <main className="relative mt-6 flex min-h-[calc(100dvh_-_13rem)] w-full flex-1 items-center justify-center md:mt-8">
      <div className="pointer-events-none absolute top-8 left-1/2 w-full max-w-3xl -translate-x-1/2 text-center">
        <p className="font-mono text-[10px] font-medium tracking-[0.18em] text-indigo-500 uppercase">
          Workflow production surface
        </p>
        <p className="mt-2 text-sm text-slate-400">Turn one clear intent into a tested, reviewable automation.</p>
      </div>

      <IntentNode
        posture={factoryVisible ? "receded" : router.posture}
        value={router.value}
        onValueChange={router.onValueChange}
        onSubmit={handleSubmit}
        inputRef={inputRef}
        placeholder={WORKSPACE_PLACEHOLDER}
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

function AuthenticatedCraftflow() {
  useMetricsSampling();

  return (
    <MotionConfig reducedMotion="user">
      <div className="pointer-events-none fixed inset-0 bg-[#F6F8FC]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(99,102,241,.12),transparent_30%),radial-gradient(circle_at_82%_15%,rgba(56,189,248,.13),transparent_26%),radial-gradient(circle_at_70%_84%,rgba(168,85,247,.10),transparent_34%)]" />
      <Suspense fallback={null}>
        <NeuralTerrainCanvas />
      </Suspense>

      <div className="pointer-events-none relative z-10 flex min-h-dvh w-full flex-col p-3 sm:p-5 md:p-7">
        <div className="flex min-h-[calc(100dvh_-_1.5rem)] w-full flex-1 flex-col rounded-[1.75rem] border border-white/80 bg-white/[0.72] p-5 shadow-[0_30px_90px_rgba(30,41,59,.10)] backdrop-blur-xl sm:min-h-[calc(100dvh_-_2.5rem)] md:min-h-[calc(100dvh_-_3.5rem)] md:rounded-[2.25rem] md:p-8">
          <HeaderSlot />
          <Workspace />
        </div>
      </div>
      <AmbientSlot />
    </MotionConfig>
  );
}

function AuthGate() {
  const baseUrl = normalizeFactoryBaseUrl(import.meta.env.VITE_FACTORY_API_BASE_URL);
  const [state, setState] = useState<AuthState>("checking");
  const loginWindowRef = useRef<Window | null>(null);

  const checkSession = useCallback(async () => {
    if (baseUrl === null) {
      setState("unavailable");
      return;
    }

    setState("checking");
    try {
      const response = await fetch(`${baseUrl}/api/runtime-truth`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (response.status === 200) {
        setState("authenticated");
        return;
      }
      if (response.status === 401) {
        setState("unauthenticated");
        return;
      }
      setState("unavailable");
    } catch {
      setState("unavailable");
    }
  }, [baseUrl]);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (state !== "unauthenticated" || baseUrl === null) {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`${baseUrl}/api/runtime-truth`, {
          method: "GET",
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (response.status === 200) {
          loginWindowRef.current?.close();
          loginWindowRef.current = null;
          setState("authenticated");
          window.focus();
        }
      } catch {
        // Stay fail-closed while the backend/session probe is unavailable.
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [baseUrl, state]);

  const openOwnerLogin = useCallback(() => {
    if (baseUrl === null) {
      setState("unavailable");
      return;
    }

    const callbackUrl = encodeURIComponent(window.location.origin);
    loginWindowRef.current = window.open(
      `${baseUrl}/api/auth/signin?callbackUrl=${callbackUrl}`,
      "craftflow-owner-login",
      "popup,width=560,height=760",
    );
  }, [baseUrl]);

  if (state === "authenticated") {
    return <AuthenticatedCraftflow />;
  }

  return (
    <LoginScreen
      state={state}
      onOwnerLogin={openOwnerLogin}
      onRetry={() => void checkSession()}
    />
  );
}

export default function App() {
  const factoryMode = import.meta.env.VITE_FACTORY_MODE?.trim() ?? "";
  return factoryMode === "http" ? <AuthGate /> : <AuthenticatedCraftflow />;
}
