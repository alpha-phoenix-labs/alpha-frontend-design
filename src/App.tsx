import { useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import {
  CommandCenter,
  CostEstimateModule,
  ModuleStage,
  SpatialModelModule,
} from "@/components/ui/index.ts";
import {
  useIntentInputFocus,
  useIntentRouter,
  useMetricsSampling,
  useSpectreFactoryIntegration,
} from "@/hooks/index.ts";
import { normalizeFactoryBaseUrl } from "@/services/factory/index.ts";
import { useSystemMetricsSnapshot } from "@/store/index.ts";
import { useActiveProductionMetrics } from "@/store/factory/index.ts";

const WORKSPACE_PLACEHOLDER = "Describe the workflow you want Craftflow to build";

type AuthState = "checking" | "authenticated" | "unauthenticated" | "unavailable";

function AuthenticatedCraftflow() {
  useMetricsSampling();
  const metrics = useSystemMetricsSnapshot();
  const router = useIntentRouter();
  const factory = useSpectreFactoryIntegration();
  const productionMetrics = useActiveProductionMetrics();
  const inputRef = useIntentInputFocus();

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
    <MotionConfig reducedMotion="user">
      <CommandCenter
        metrics={metrics}
        activeJobId={factory.activeJobId}
        job={factory.activeJob}
        gate={factory.humanGate}
        testReport={factory.testReport}
        productionMetrics={productionMetrics}
        intentPosture="idle"
        intentValue={router.value}
        onIntentChange={router.onValueChange}
        onIntentSubmit={handleSubmit}
        inputRef={inputRef}
        approvalVersion={factory.approvalVersion}
        approvalBusy={factory.approvalBusy}
        approvalConflict={factory.approvalConflict}
        onApproval={factory.submitApproval}
        lastError={factory.lastError}
        clarificationDraft={factory.clarificationDraft}
        onClarificationDraftChange={factory.setClarificationDraft}
        onSubmitClarification={factory.submitClarification}
        clarificationBusy={factory.clarificationBusy}
        mutationUnconfirmed={factory.mutationUnconfirmed}
        recoveryBusy={factory.recoveryBusy}
        onRecoverMutation={factory.recoverMutation}
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4">
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
      </div>

      <div className="sr-only">{WORKSPACE_PLACEHOLDER}</div>
    </MotionConfig>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#eef4fb] px-6 text-slate-800">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,.12),transparent_26rem),radial-gradient(circle_at_82%_18%,rgba(124,58,237,.10),transparent_28rem),linear-gradient(180deg,#f8fbff,#eef4fb)]" />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </main>
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
      <AuthShell>
        <section
          data-testid="auth-gate-checking"
          className="glass-panel rounded-[24px] p-8 text-center"
        >
          <div className="mx-auto size-3 animate-pulse rounded-full bg-indigo-500 shadow-neon-indigo motion-reduce:animate-none" />
          <p className="mt-4 font-mono text-sm text-slate-600">OWNER Session wird geprüft…</p>
        </section>
      </AuthShell>
    );
  }

  if (state === "unauthenticated" && baseUrl !== null) {
    return (
      <AuthShell>
        <section
          data-testid="auth-gate-unauthenticated"
          className="glass-panel-strong rounded-[26px] p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Craftflow Control</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">OWNER Login erforderlich</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Die Produktionsoberfläche wird erst nach einer gültigen OWNER-Session freigegeben.
          </p>
          <button
            data-testid="auth-login-button"
            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] px-4 py-3 text-sm font-bold text-white shadow-neon-indigo"
            type="button"
            onClick={openOwnerLogin}
          >
            OWNER Login öffnen
          </button>
          <button
            data-testid="auth-retry"
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white/75 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
            type="button"
            onClick={() => void checkSession()}
          >
            Sitzung erneut prüfen
          </button>
        </section>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <section
        data-testid="auth-gate-unavailable"
        className="glass-panel-strong rounded-[26px] border-rose-200 p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">Fail-closed</p>
        <h1 className="mt-3 text-2xl font-black text-slate-950">Sitzungsprüfung nicht verfügbar</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Craftflow bleibt gesperrt, bis die OWNER-Session sicher geprüft werden kann.
        </p>
        <button
          data-testid="auth-retry"
          className="mt-6 w-full rounded-xl border border-slate-200 bg-white/75 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
          type="button"
          onClick={() => void checkSession()}
        >
          Erneut prüfen
        </button>
      </section>
    </AuthShell>
  );
}

export default function App() {
  const factoryMode = import.meta.env.VITE_FACTORY_MODE?.trim() ?? "";
  return factoryMode === "http" ? <AuthGate /> : <AuthenticatedCraftflow />;
}
