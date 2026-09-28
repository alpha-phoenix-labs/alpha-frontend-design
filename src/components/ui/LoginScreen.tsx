import type { AuthState } from "@/types/auth.ts";

export interface LoginScreenProps {
  state: Exclude<AuthState, "authenticated">;
  onOwnerLogin: () => void;
  onRetry: () => void;
}

const featureItems = [
  { label: "Automate", detail: "From intent to executable workflow" },
  { label: "Validate", detail: "Real tests, evidence and human gates" },
  { label: "Deploy", detail: "Controlled delivery with exact runtime truth" },
] as const;

export function LoginScreen({ state, onOwnerLogin, onRetry }: LoginScreenProps) {
  const checking = state === "checking";
  const unavailable = state === "unavailable";

  return (
    <main className="min-h-dvh bg-white text-slate-950">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.35fr)_minmax(440px,0.65fr)]">
        <section className="relative isolate hidden overflow-hidden lg:flex lg:min-h-dvh lg:flex-col lg:justify-between lg:p-12 xl:p-16">
          <img
            src="/login-background.svg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,.88)_0%,rgba(255,255,255,.38)_46%,rgba(238,242,255,.16)_100%)]" />

          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl border border-white/70 bg-white/75 shadow-[0_18px_55px_rgba(99,102,241,.16)] backdrop-blur-xl">
              <div className="size-3 rounded-full bg-[linear-gradient(135deg,#4F46E5,#8B5CF6)] shadow-[0_0_24px_rgba(99,102,241,.65)]" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-[0.18em] text-slate-900 uppercase">Craftflow</p>
              <p className="text-xs text-slate-500">AI workflow production system</p>
            </div>
          </div>

          <div className="max-w-3xl pb-10">
            <p className="mb-5 font-mono text-[11px] font-medium tracking-[0.2em] text-indigo-600 uppercase">
              Production intelligence
            </p>
            <h1 className="max-w-2xl text-5xl font-semibold tracking-[-0.055em] text-slate-950 xl:text-7xl">
              Build real workflows from one clear intent.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 xl:text-lg">
              Plan, generate, validate and approve automation in one controlled production surface.
            </p>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {featureItems.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/60 bg-white/60 p-4 shadow-[0_12px_45px_rgba(71,85,105,.08)] backdrop-blur-xl">
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#F8FAFC] px-6 py-10 sm:px-10 lg:bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,.12),transparent_34%),radial-gradient(circle_at_80%_82%,rgba(56,189,248,.12),transparent_34%)] lg:hidden" />

          <div className="relative w-full max-w-[460px]">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="grid size-10 place-items-center rounded-2xl bg-white shadow-[0_14px_40px_rgba(79,70,229,.12)]">
                <div className="size-3 rounded-full bg-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-[0.16em] uppercase">Craftflow</p>
                <p className="text-xs text-slate-500">AI workflow production system</p>
              </div>
            </div>

            <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-indigo-600 uppercase">
              Owner access
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-slate-950">Welcome back.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
              Craftflow stays locked until the backend confirms a valid OWNER session.
            </p>

            {checking ? (
              <div
                data-testid="auth-gate-checking"
                className="mt-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,.08)]"
              >
                <div className="flex items-center gap-4">
                  <div className="relative size-11 rounded-2xl bg-indigo-50">
                    <div className="absolute inset-0 m-auto size-3 animate-pulse rounded-full bg-indigo-600 motion-reduce:animate-none" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">OWNER session is being checked</p>
                    <p className="mt-1 text-xs text-slate-500">Secure runtime validation in progress.</p>
                  </div>
                </div>
              </div>
            ) : unavailable ? (
              <div
                data-testid="auth-gate-unavailable"
                className="mt-9 rounded-3xl border border-rose-200 bg-rose-50/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,.06)]"
              >
                <p className="text-xs font-semibold tracking-[0.14em] text-rose-600 uppercase">Fail-closed</p>
                <h3 className="mt-3 text-lg font-semibold text-slate-950">Session verification unavailable</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Craftflow remains locked until OWNER access can be verified safely.
                </p>
                <button
                  data-testid="auth-retry"
                  type="button"
                  onClick={onRetry}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                >
                  Check session again
                </button>
              </div>
            ) : (
              <div
                data-testid="auth-gate-unauthenticated"
                className="mt-9 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,.08)]"
              >
                <div className="rounded-2xl border border-indigo-100 bg-[linear-gradient(135deg,#EEF2FF,#F8FAFC)] p-4">
                  <p className="text-sm font-semibold text-slate-900">Secure OWNER authentication</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Login opens in a protected window. This interface never stores your credentials.
                  </p>
                </div>
                <button
                  data-testid="auth-login-button"
                  type="button"
                  onClick={onOwnerLogin}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(79,70,229,.24)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(79,70,229,.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                >
                  Open OWNER Login
                </button>
                <button
                  data-testid="auth-retry"
                  type="button"
                  onClick={onRetry}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
                >
                  Check session again
                </button>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 font-mono text-[10px] tracking-[0.12em] text-slate-400 uppercase">
              <span>Fail-closed security</span>
              <span>Craftflow Control</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
