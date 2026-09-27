import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
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
import { normalizeFactoryBaseUrl } from "@/services/factory/index.ts";
import { useSystemMetricsSnapshot } from "@/store/index.ts";

const NeuralTerrainCanvas = lazy(() => import("@/components/canvas/NeuralTerrainCanvas.tsx"));
const WORKSPACE_PLACEHOLDER = "Describe the workflow you want Craftflow to build";

type AuthState = "checking" | "authenticated" | "unauthenticated" | "unavailable";

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

  if (state === "checking") {
    return (
      <main
        data-testid="auth-gate-checking"
        className="flex min-h-dvh items-center justify-center bg-[#05070b] px-6 text-slate-100"
      >
        <p className="font-mono text-sm text-slate-400">OWNER Session wird geprüft…</p>
      </main>
    );
  }

  if (state === "unauthenticated" && baseUrl !== null) {
    return (
      <main
        data-testid="auth-gate-unauthenticated"
        className="flex min-h-dvh items-center justify-center bg-[#05070b] px-6 text-slate-100"
      >
        <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/80 p-8 shadow-2xl shadow-black/30">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">Craftflow Control</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">OWNER Login erforderlich</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Die Produktionsoberfläche wird erst nach einer gültigen OWNER-Session freigegeben.
          </p>
          <button
            data-testid="auth-login-button"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950"
            type="button"
            onClick={openOwnerLogin}
          >
            OWNER Login öffnen
          </button>
          <button
            data-testid="auth-retry"
            className="mt-3 w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200"
            type="button"
            onClick={() => void checkSession()}
          >
            Sitzung erneut prüfen
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      data-testid="auth-gate-unavailable"
      className="flex min-h-dvh items-center justify-center bg-[#05070b] px-6 text-slate-100"
    >
      <section className="w-full max-w-md rounded-3xl border border-red-900/60 bg-slate-950/80 p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">Fail-closed</p>
        <h1 className="mt-3 text-2xl font-black">Sitzungsprüfung nicht verfügbar</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Craftflow bleibt gesperrt, bis die OWNER-Session sicher geprüft werden kann.
        </p>
        <button
          data-testid="auth-retry"
          className="mt-6 w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200"
          type="button"
          onClick={() => void checkSession()}
        >
          Erneut prüfen
        </button>
      </section>
    </main>
  );
}

export default function App() {
  const factoryMode = import.meta.env.VITE_FACTORY_MODE?.trim() ?? "";
  return factoryMode === "http" ? <AuthGate /> : <AuthenticatedCraftflow />;
}
