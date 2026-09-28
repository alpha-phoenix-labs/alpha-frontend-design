import type { AuthState } from "@/types/auth.ts";

export interface LoginScreenProps {
  state: Exclude<AuthState, "authenticated">;
  onOwnerLogin: () => void;
  onRetry: () => void;
}

export function LoginScreen({ state, onOwnerLogin, onRetry }: LoginScreenProps) {
  const checking = state === "checking";
  const unavailable = state === "unavailable";

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#02060d] text-slate-100">
      <img src="/login-background.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,13,.30),rgba(2,6,13,.08)_48%,rgba(2,6,13,.58))]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgba(2,6,13,.78),transparent)]" />

      <div className="relative z-10 flex min-h-dvh flex-col p-6 sm:p-8 lg:p-12">
        <div className="flex items-center gap-3">
          <div className="relative grid size-10 place-items-center">
            <div className="absolute size-9 rotate-45 rounded-[9px] bg-[linear-gradient(135deg,#22D3EE,#4F46E5_55%,#A855F7)] shadow-[0_0_25px_rgba(79,70,229,.45)]" />
            <div className="relative size-3 rotate-45 rounded-[3px] bg-[#07101f]" />
          </div>
          <div>
            <p className="text-[15px] font-extrabold tracking-[0.08em] text-white">CRAFT<span className="text-indigo-400">FLOW</span></p>
            <p className="text-[7px] font-semibold tracking-[0.18em] text-slate-500 uppercase">AI Automation System</p>
          </div>
        </div>

        <div className="mt-auto flex justify-end pb-[8vh]">
          <section className="w-full max-w-[390px] rounded-[22px] border border-[#1b3152] bg-[#07101f]/92 p-6 shadow-[0_28px_90px_rgba(0,0,0,.48)] backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-center">
              <div className="relative grid size-14 place-items-center">
                <div className="absolute size-11 rotate-45 rounded-[11px] bg-[linear-gradient(135deg,#22D3EE,#4F46E5_55%,#A855F7)] shadow-[0_0_28px_rgba(99,102,241,.42)]" />
                <div className="relative size-4 rotate-45 rounded-[4px] bg-[#07101f]" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-[13px] font-extrabold tracking-[0.12em] text-white">CRAFTFLOW</p>
              <p className="mt-1 text-[8px] tracking-[0.14em] text-slate-500 uppercase">AI Automation System</p>
            </div>

            <div className="mt-6 rounded-2xl border border-[#142744] bg-[#050d19]/80 p-4">
              <h1 className="text-[17px] font-semibold text-white">Willkommen zurück</h1>
              <p className="mt-1 text-[10px] text-slate-500">Zugriff auf dein Command Center</p>
            </div>

            {checking ? (
              <div data-testid="auth-gate-checking" className="mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4">
                <div className="flex items-center gap-3">
                  <span className="size-2.5 animate-pulse rounded-full bg-indigo-400 shadow-[0_0_14px_rgba(129,140,248,.7)] motion-reduce:animate-none" />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-200">OWNER Session wird geprüft</p>
                    <p className="mt-1 text-[8px] text-slate-600">Runtime-Truth wird fail-closed verifiziert.</p>
                  </div>
                </div>
              </div>
            ) : unavailable ? (
              <div data-testid="auth-gate-unavailable" className="mt-4 rounded-2xl border border-rose-500/25 bg-rose-500/[0.06] p-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-rose-300">Fail-closed</p>
                <p className="mt-2 text-[10px] text-slate-300">Sitzungsprüfung nicht verfügbar. Craftflow bleibt gesperrt.</p>
                <button
                  data-testid="auth-retry"
                  type="button"
                  onClick={onRetry}
                  className="mt-4 w-full rounded-xl border border-[#243b61] bg-[#0a1728] py-2.5 text-[10px] font-semibold text-slate-200 transition hover:border-indigo-400/40"
                >
                  Erneut prüfen
                </button>
              </div>
            ) : (
              <div data-testid="auth-gate-unauthenticated" className="mt-4">
                <div className="space-y-2">
                  <div className="rounded-xl border border-[#172744] bg-[#050d19]/72 px-3 py-3">
                    <p className="text-[9px] text-slate-500">Authentifizierung</p>
                    <p className="mt-1 text-[10px] text-slate-300">Sicherer OWNER-Popup-Flow über das bestehende Backend</p>
                  </div>
                  <div className="rounded-xl border border-[#172744] bg-[#050d19]/72 px-3 py-3">
                    <p className="text-[9px] text-slate-500">Session</p>
                    <p className="mt-1 text-[10px] text-slate-300">Runtime-Truth + credentialed cookie verification</p>
                  </div>
                </div>

                <button
                  data-testid="auth-login-button"
                  type="button"
                  onClick={onOwnerLogin}
                  className="mt-4 flex w-full items-center justify-center rounded-xl border border-indigo-400/30 bg-[linear-gradient(90deg,#4338CA,#4F46E5)] py-3 text-[10px] font-semibold text-white shadow-[0_0_24px_rgba(79,70,229,.28)] transition hover:brightness-110"
                >
                  OWNER Login öffnen →
                </button>
                <button
                  data-testid="auth-retry"
                  type="button"
                  onClick={onRetry}
                  className="mt-2 w-full rounded-xl border border-[#1b3152] bg-[#071426] py-2.5 text-[9px] font-medium text-slate-400 transition hover:text-slate-200"
                >
                  Session erneut prüfen
                </button>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-[#142744] pt-4 text-[7px] text-slate-600">
              <span>Nur für autorisierte Nutzer</span>
              <span>CRAFTFLOW Control</span>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
