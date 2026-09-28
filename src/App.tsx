import { useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import {
  CommandCenter,
  CostEstimateModule,
  LoginScreen,
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
import type { AuthState } from "@/types/auth.ts";

const WORKSPACE_PLACEHOLDER = "Describe the workflow you want Craftflow to build";

function AuthenticatedCraftflow() {
  useMetricsSampling();
  const metrics = useSystemMetricsSnapshot();
  const router = useIntentRouter();
  const factory = useSpectreFactoryIntegration();
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
        intentPosture="idle"
        intentValue={router.value}
        onIntentChange={router.onValueChange}
        onIntentSubmit={handleSubmit}
        inputRef={inputRef}
        approvalVersion={factory.approvalVersion}
        approvalBusy={factory.approvalBusy}
        approvalConflict={factory.approvalConflict}
        onApproval={factory.submitApproval}
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

  return <LoginScreen state={state} onOwnerLogin={openOwnerLogin} onRetry={() => void checkSession()} />;
}

export default function App() {
  const factoryMode = import.meta.env.VITE_FACTORY_MODE?.trim() ?? "";
  return factoryMode === "http" ? <AuthGate /> : <AuthenticatedCraftflow />;
}
