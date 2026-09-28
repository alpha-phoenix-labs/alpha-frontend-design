import type { ReactNode, Ref } from "react";
import type { IntentNodePosture, SystemMetrics } from "@/types/index.ts";
import type {
  FactoryJob,
  HumanGateState,
  TestReportV1,
  WorkflowProductionMetrics,
} from "@/types/factory/index.ts";
import { IntentNode } from "@/components/ui/IntentNode.tsx";

interface CommandCenterProps {
  metrics: SystemMetrics;
  activeJobId: string | null;
  job: FactoryJob | null;
  gate: HumanGateState | null;
  testReport: TestReportV1 | null;
  productionMetrics: WorkflowProductionMetrics | null;
  intentPosture: IntentNodePosture;
  intentValue: string;
  onIntentChange: (value: string) => void;
  onIntentSubmit: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  approvalVersion: number | null;
  approvalBusy: boolean;
  approvalConflict: boolean;
  onApproval: (approve: boolean) => void;
}

type StageTone = "done" | "active" | "idle" | "blocked";

const pipeline = [
  { key: "intent", label: "Anforderung", short: "Ziele analysieren" },
  { key: "architect", label: "Architect", short: "Plan erstellen" },
  { key: "build", label: "Workflow Build", short: "n8n generieren" },
  { key: "n8n", label: "n8n", short: "Workflow aktiv" },
  { key: "tests", label: "Tests", short: "Automatisch testen" },
  { key: "repair", label: "Repair", short: "Fehler beheben" },
  { key: "gate", label: "Human Gate", short: "Freigabe erforderlich" },
  { key: "production", label: "Production", short: "Deploy & Monitor" },
  { key: "evidence", label: "Drive Evidence", short: "Nachweise sichern" },
] as const;

const navItems = [
  ["⌂", "Übersicht"],
  ["⌘", "Workflows"],
  ["◉", "Agenten"],
  ["△", "Tests"],
  ["◇", "Deployments"],
  ["▣", "Drive Evidence"],
  ["∞", "Integrationen"],
  ["$", "Kosten"],
  ["▥", "Analysen"],
  ["⚙", "Einstellungen"],
] as const;

function activeIndex(job: FactoryJob | null): number {
  switch (job?.status) {
    case "queued":
      return 0;
    case "generating":
      return 2;
    case "generated":
    case "importing":
      return 3;
    case "testing":
      return 4;
    case "blocked":
    case "failed":
      return 5;
    case "awaiting_human":
      return 6;
    case "approved":
      return 7;
    case "completed":
      return 8;
    default:
      return -1;
  }
}

function stageTone(index: number, current: number, job: FactoryJob | null): StageTone {
  if (job === null || current < 0) return "idle";
  if ((job.status === "blocked" || job.status === "failed") && index === 5) return "blocked";
  if (index < current) return "done";
  if (index === current) return job.status === "completed" ? "done" : "active";
  return "idle";
}

const toneClasses: Record<StageTone, { node: string; dot: string; label: string }> = {
  done: {
    node: "border-cyan-400/60 bg-cyan-400/10 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,.18)]",
    dot: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.65)]",
    label: "text-slate-100",
  },
  active: {
    node: "border-violet-400/80 bg-violet-500/15 text-violet-100 shadow-[0_0_32px_rgba(124,58,237,.35)]",
    dot: "bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,.75)]",
    label: "text-white",
  },
  blocked: {
    node: "border-amber-400/80 bg-amber-500/10 text-amber-100 shadow-[0_0_28px_rgba(245,158,11,.20)]",
    dot: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,.65)]",
    label: "text-amber-100",
  },
  idle: {
    node: "border-slate-700 bg-slate-900/72 text-slate-500",
    dot: "bg-slate-600",
    label: "text-slate-400",
  },
};

const numberFormat = new Intl.NumberFormat("de-DE");
const moneyFormat = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCost(metrics: WorkflowProductionMetrics | null): string {
  return metrics === null ? "—" : moneyFormat.format(metrics.totalCostMicros / 1_000_000);
}

function formatDuration(ms: number | undefined): string {
  if (ms === undefined) return "—";
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function NodeGlyph({ index }: { index: number }) {
  const glyphs = ["⌁", "◈", "⌘", "∞", "△", "⌕", "◎", "⇧", "▣"];
  return <span className="font-mono text-[17px]">{glyphs[index]}</span>;
}

function StatusPill({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "violet";
}) {
  const cls =
    tone === "success"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      : tone === "warning"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-300"
        : tone === "danger"
          ? "border-rose-500/25 bg-rose-500/10 text-rose-300"
          : tone === "violet"
            ? "border-violet-500/25 bg-violet-500/10 text-violet-300"
            : "border-slate-700 bg-slate-800/70 text-slate-400";

  return (
    <span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] ${cls}`}>
      {children}
    </span>
  );
}

function Panel({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-[18px] border border-[#172744] bg-[#07101f]/94 shadow-[0_14px_40px_rgba(0,0,0,.18)]">
      <div className="flex min-h-11 items-center justify-between border-b border-[#172744] px-4">
        <h3 className="text-[12px] font-semibold text-slate-100">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Sidebar({
  metrics,
  job,
  report,
  productionMetrics,
}: {
  metrics: SystemMetrics;
  job: FactoryJob | null;
  report: TestReportV1 | null;
  productionMetrics: WorkflowProductionMetrics | null;
}) {
  const systemRows = [
    { label: "Core Services", known: true, ok: metrics.edgeComputeActive },
    { label: "n8n Runtime", known: report?.executionId !== undefined || report?.importedId !== undefined, ok: report?.result === "PASS" },
    { label: "Agent Pool", known: productionMetrics !== null, ok: (productionMetrics?.agentCalls ?? 0) > 0 },
    { label: "Tests bereit", known: productionMetrics !== null, ok: (productionMetrics?.testCount ?? 0) > 0 && (productionMetrics?.failed ?? 0) === 0 },
    { label: "Drive Evidence", known: report?.evidence !== undefined, ok: report?.evidence !== undefined },
  ];

  return (
    <aside className="hidden w-[205px] shrink-0 flex-col border-r border-[#15243f] bg-[#06101d]/96 lg:flex">
      <div className="flex h-[72px] items-center gap-3 border-b border-[#15243f] px-5">
        <div className="relative grid size-9 place-items-center">
          <div className="absolute size-8 rotate-45 rounded-[8px] bg-[linear-gradient(135deg,#22D3EE,#4F46E5_55%,#A855F7)] shadow-[0_0_22px_rgba(79,70,229,.36)]" />
          <div className="relative size-3 rotate-45 rounded-[3px] bg-[#07101f]" />
        </div>
        <div>
          <p className="text-[14px] font-extrabold tracking-[0.08em] text-white">
            CRAFT<span className="text-indigo-400">FLOW</span>
          </p>
          <p className="mt-0.5 text-[7px] font-semibold tracking-[0.18em] text-slate-500 uppercase">AI Automation System</p>
        </div>
      </div>

      <nav className="space-y-1 px-3 py-4">
        {navItems.map(([glyph, item], index) => (
          <button
            key={item}
            type="button"
            aria-current={index === 0 ? "page" : undefined}
            disabled={index !== 0}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition ${index === 0 ? "bg-[linear-gradient(90deg,#4338CA,#3730A3)] text-white shadow-[0_0_22px_rgba(79,70,229,.28)]" : "text-slate-400 disabled:cursor-default"}`}
          >
            <span
              className={`grid size-6 place-items-center rounded-lg border font-mono text-[12px] ${index === 0 ? "border-indigo-300/30 bg-white/10" : "border-slate-800 bg-slate-900/70"}`}
            >
              {glyph}
            </span>
            {item}
          </button>
        ))}
      </nav>

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-[#1a3151] bg-[#08182a] p-4">
          <p className="text-[11px] font-semibold text-slate-200">System Status</p>
          <div className="mt-3 space-y-2 text-[10px]">
            {systemRows.map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span
                  className={`size-1.5 rounded-full ${row.known ? (row.ok ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.65)]" : "bg-amber-400") : "bg-slate-600"}`}
                />
                <span className={row.known ? "text-slate-400" : "text-slate-600"}>{row.label}</span>
              </div>
            ))}
          </div>
          {job !== null && <p className="mt-3 truncate font-mono text-[8px] text-slate-600">{job.id}</p>}
        </div>
      </div>
    </aside>
  );
}

function StageNode({ index, current, job }: { index: number; current: number; job: FactoryJob | null }) {
  const stage = pipeline[index];
  if (stage === undefined) return null;
  const tone = stageTone(index, current, job);
  const cls = toneClasses[tone];

  return (
    <div className="relative flex min-w-0 flex-col items-center text-center">
      <div className={`grid size-12 place-items-center rounded-2xl border ${cls.node}`}>
        <NodeGlyph index={index} />
      </div>
      <span className={`mt-2 text-[10px] font-semibold ${cls.label}`}>{stage.label}</span>
      <span className="mt-0.5 text-[8px] text-slate-600">{stage.short}</span>
      <span className={`mt-2 size-1.5 rounded-full ${cls.dot}`} />
    </div>
  );
}

function WorkflowCore({ job, activeJobId }: { job: FactoryJob | null; activeJobId: string | null }) {
  const current = activeIndex(job);

  return (
    <section className="rounded-[18px] border border-[#172744] bg-[#07101f]/94 p-4 shadow-[0_16px_50px_rgba(0,0,0,.22)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-white">Workflow: {activeJobId ?? "Kein aktiver Lauf"}</h2>
            {job !== null && (
              <StatusPill tone={job.status === "completed" ? "success" : job.status === "failed" ? "danger" : "success"}>
                {job.status}
              </StatusPill>
            )}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">Von Anforderung bis Production — automatisiert, überprüft, nachvollziehbar.</p>
        </div>
        <div className="flex items-center gap-2">
          {job !== null && <StatusPill tone="violet">{`v${job.version}`}</StatusPill>}
          <button type="button" disabled className="rounded-lg border border-[#203657] bg-[#0b1728] px-3 py-2 text-[10px] text-slate-500">
            Details
          </button>
        </div>
      </div>

      <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#142744] bg-[#050d19] px-4 py-5">
        <div className="absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle,#38BDF8_1px,transparent_1px)] [background-size:19px_19px]" />
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="flow-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.72" />
              <stop offset="48%" stopColor="#6366F1" stopOpacity="0.86" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.72" />
            </linearGradient>
          </defs>
          <path d="M9 27 H70 C84 27 92 31 92 41 V48 C92 57 86 61 74 61 H9 C5 61 5 68 9 68 H92" fill="none" stroke="#172744" strokeWidth="1.15" />
          {job !== null && (
            <path d="M9 27 H70 C84 27 92 31 92 41 V48 C92 57 86 61 74 61 H9 C5 61 5 68 9 68 H92" fill="none" stroke="url(#flow-line)" strokeWidth="0.8" strokeDasharray="1.7 1.2" opacity="0.85" />
          )}
        </svg>

        <div className="relative mx-auto grid max-w-[76%] grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((index) => (
            <StageNode key={index} index={index} current={current} job={job} />
          ))}
        </div>

        <div className="relative mt-7 grid grid-cols-5 gap-3">
          {[4, 5, 6, 7, 8].map((index) => (
            <StageNode key={index} index={index} current={current} job={job} />
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="rounded-xl border border-[#152945] bg-[#091625] p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Aktueller Schritt</p>
          <p data-testid="factory-status" className="mt-1 text-[12px] font-semibold text-slate-100">{job?.status ?? "idle"}</p>
          <p className="mt-0.5 text-[9px] text-slate-500">
            {job ? `Aktualisiert: ${new Date(job.updatedAt).toLocaleTimeString("de-DE")}` : "Bereit für neue Anforderung"}
          </p>
        </div>
        <div className="rounded-xl border border-[#152945] bg-[#091625] px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Version</p>
          <p className="mt-1 font-mono text-[12px] text-slate-200">{job?.version ?? "—"}</p>
        </div>
        <div className="rounded-xl border border-[#152945] bg-[#091625] px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Job ID</p>
          <p className="mt-1 max-w-[160px] truncate font-mono text-[10px] text-slate-300">{activeJobId ?? "—"}</p>
        </div>
      </div>
    </section>
  );
}

function RuntimePanel({
  job,
  gate,
  report,
  productionMetrics,
}: {
  job: FactoryJob | null;
  gate: HumanGateState | null;
  report: TestReportV1 | null;
  productionMetrics: WorkflowProductionMetrics | null;
}) {
  const rows: Array<[string, string, "success" | "violet" | "warning" | "danger" | "neutral"]> = [
    ["Factory API", "OWNER session verified", "success"],
    ["Active Job", job?.status ?? "Idle", job ? "violet" : "neutral"],
    ["Test Report", report?.result ?? "No report", report?.result === "PASS" ? "success" : report?.result === "NOT_PASS" ? "danger" : "neutral"],
    ["Human Gate", gate?.status ?? "Inactive", gate?.status === "awaiting_human" ? "warning" : "neutral"],
    ["Production Metrics", productionMetrics ? "Runtime evidence available" : "No runtime evidence", productionMetrics ? "success" : "neutral"],
    ["Agent telemetry", "Not exposed by current contract", "neutral"],
  ];

  return (
    <Panel title="Runtime / Agents" action={<span className="text-[9px] text-indigo-400">Source of truth</span>}>
      <div className="space-y-2.5">
        {rows.map(([label, value, tone]) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-[#11253f] bg-[#08182a] px-3 py-2.5">
            <span className={`grid size-7 place-items-center rounded-lg border ${tone === "warning" ? "border-amber-500/25 bg-amber-500/10 text-amber-300" : tone === "danger" ? "border-rose-500/25 bg-rose-500/10 text-rose-300" : tone === "success" ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-300" : "border-violet-500/20 bg-violet-500/10 text-violet-300"}`}>
              <span className="size-1.5 rounded-full bg-current" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium text-slate-300">{label}</p>
              <p className="mt-0.5 truncate font-mono text-[8px] text-slate-600">{value}</p>
            </div>
            <StatusPill tone={tone}>{tone === "success" ? "online" : tone === "warning" ? "gate" : tone === "danger" ? "fail" : "state"}</StatusPill>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function TestPanel({
  report,
  productionMetrics,
}: {
  report: TestReportV1 | null;
  productionMetrics: WorkflowProductionMetrics | null;
}) {
  const planned = productionMetrics?.testCount ?? 0;
  const passed = productionMetrics?.passed ?? 0;
  const failed = productionMetrics?.failed ?? 0;
  const ratio = planned > 0 ? Math.round((passed / planned) * 100) : 0;
  const tone = report?.result === "PASS" ? "success" : report?.result === "NOT_PASS" ? "danger" : "neutral";

  return (
    <div data-testid="test-report-v1">
      <Panel title="Tests / Repair" action={<span className="text-[9px] text-slate-600">TestReportV1</span>}>
        <div className="flex items-center gap-4">
          <div
            className="grid size-20 shrink-0 place-items-center rounded-full"
            style={{ background: planned > 0 ? `conic-gradient(#34d399 ${ratio}%, #ef4444 ${ratio}% ${Math.min(100, ratio + (failed / planned) * 100)}%, #172744 0)` : "#172744" }}
          >
            <div className="grid size-[58px] place-items-center rounded-full bg-[#081524] text-center">
              <div>
                <p className="text-[14px] font-bold text-white">{planned > 0 ? `${passed}/${planned}` : "—"}</p>
                <p className="text-[7px] text-slate-600">Tests</p>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <StatusPill tone={tone}>{report?.result ?? (planned > 0 ? "RUNNING" : "NOT RUN")}</StatusPill>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[8px]">
              <span className="text-slate-600">Bestanden</span><span className="text-emerald-300">{passed}</span>
              <span className="text-slate-600">Fehlgeschlagen</span><span className="text-rose-300">{failed}</span>
              <span className="text-slate-600">Retry</span><span className="text-slate-300">{productionMetrics?.retryLoops ?? "—"}</span>
              <span className="text-slate-600">Repair</span><span className="text-slate-300">{productionMetrics?.repairLoops ?? "—"}</span>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function CostPanel({ metrics }: { metrics: WorkflowProductionMetrics | null }) {
  const tokenTotal = metrics === null ? null : metrics.tokensIn + metrics.tokensOut;
  return (
    <Panel title="Kosten / Token / Dauer" action={<span className="text-[9px] text-slate-600">{metrics?.testMode ?? "Runtime"}</span>}>
      <p className="text-[24px] font-semibold tracking-[-0.04em] text-white">{formatCost(metrics)}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["Tokens", tokenTotal === null ? "—" : numberFormat.format(tokenTotal)],
          ["Laufzeit", formatDuration(metrics?.productionTimeMs)],
          ["Calls", metrics === null ? "—" : numberFormat.format(metrics.modelCalls + metrics.agentCalls)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#122641] bg-[#08182a] p-3">
            <p className="text-[7px] uppercase tracking-[0.1em] text-slate-600">{label}</p>
            <p className="mt-2 truncate font-mono text-[11px] font-semibold text-slate-300">{value}</p>
          </div>
        ))}
      </div>
      {metrics !== null && (
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-[7px] text-slate-600"><span>Input Tokens</span><span>{numberFormat.format(metrics.tokensIn)}</span></div>
          <div className="h-1 rounded-full bg-[#122641]"><div className="h-1 max-w-full rounded-full bg-cyan-400/70" style={{ width: `${tokenTotal && tokenTotal > 0 ? Math.max(4, (metrics.tokensIn / tokenTotal) * 100) : 0}%` }} /></div>
          <div className="flex justify-between text-[7px] text-slate-600"><span>Output Tokens</span><span>{numberFormat.format(metrics.tokensOut)}</span></div>
          <div className="h-1 rounded-full bg-[#122641]"><div className="h-1 max-w-full rounded-full bg-violet-400/70" style={{ width: `${tokenTotal && tokenTotal > 0 ? Math.max(4, (metrics.tokensOut / tokenTotal) * 100) : 0}%` }} /></div>
        </div>
      )}
    </Panel>
  );
}

function GatePanel({
  gate,
  approvalVersion,
  approvalBusy,
  approvalConflict,
  onApproval,
}: {
  gate: HumanGateState | null;
  approvalVersion: number | null;
  approvalBusy: boolean;
  approvalConflict: boolean;
  onApproval: (approve: boolean) => void;
}) {
  const awaiting = gate?.type === "approval" && gate.status === "awaiting_human";
  return (
    <Panel title="Human Gate" action={<StatusPill tone={awaiting ? "warning" : "neutral"}>{awaiting ? "ausstehend" : "inaktiv"}</StatusPill>}>
      <div className={`rounded-xl border p-3 ${awaiting ? "border-amber-500/30 bg-amber-500/[0.07]" : "border-[#122641] bg-[#08182a]"}`}>
        <p className="text-[10px] font-semibold text-slate-200">{awaiting ? "Benötigt deine Entscheidung." : "Keine Freigabe ausstehend."}</p>
        <p className="mt-1 text-[8px] leading-4 text-slate-500">
          {awaiting ? (
            <>Approval-Snapshot <span data-testid="approval-version">version {approvalVersion ?? "—"}</span> ist an den sichtbaren Gate-Snapshot gebunden.</>
          ) : (
            "Craftflow fährt ohne offenen Human Gate fort."
          )}
        </p>
        {approvalConflict && <p className="mt-2 text-[8px] text-amber-300">Version geändert — Entscheidung erneut prüfen.</p>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onApproval(false)}
            aria-label="Reject"
            disabled={!awaiting || approvalBusy || approvalVersion === null}
            className="rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-3 py-2 text-[9px] font-semibold text-rose-300 disabled:opacity-30"
          >
            Ablehnen
          </button>
          <button
            type="button"
            onClick={() => onApproval(true)}
            aria-label="Approve"
            disabled={!awaiting || approvalBusy || approvalVersion === null}
            className="rounded-lg border border-indigo-400/30 bg-[linear-gradient(90deg,#4338CA,#4F46E5)] px-3 py-2 text-[9px] font-semibold text-white shadow-[0_0_18px_rgba(79,70,229,.22)] disabled:opacity-30"
          >
            {approvalBusy ? "Sende…" : "Freigeben"}
          </button>
        </div>
      </div>
    </Panel>
  );
}

function EvidencePanel({
  report,
  job,
  productionMetrics,
}: {
  report: TestReportV1 | null;
  job: FactoryJob | null;
  productionMetrics: WorkflowProductionMetrics | null;
}) {
  const entries = [
    ["Job Status", job?.status ?? "—"],
    ["Workflow ID", productionMetrics?.workflowId ?? "—"],
    ["Imported ID", report?.importedId ?? "—"],
    ["Execution ID", report?.executionId ?? "—"],
  ];
  return (
    <Panel title="Evidence / Deploy Truth" action={<span className="text-[9px] text-indigo-400">auditierbar</span>}>
      <div className="grid gap-2 sm:grid-cols-2">
        {entries.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#122641] bg-[#08182a] px-3 py-2.5">
            <p className="text-[8px] uppercase tracking-[0.1em] text-slate-600">{label}</p>
            <p className="mt-1 truncate font-mono text-[9px] text-slate-300">{value}</p>
          </div>
        ))}
      </div>
      {report?.evidence !== undefined && (
        <div className="mt-2 rounded-xl border border-[#122641] bg-[#08182a] px-3 py-2.5">
          <p className="text-[8px] uppercase tracking-[0.1em] text-slate-600">Evidence</p>
          <p className="mt-1 break-all font-mono text-[9px] text-cyan-300">{report.evidence}</p>
        </div>
      )}
    </Panel>
  );
}

function RunsPanel({ job, activeJobId }: { job: FactoryJob | null; activeJobId: string | null }) {
  return (
    <Panel title="Aktuelle Runs" action={<span className="text-[9px] text-slate-600">Source of truth</span>}>
      {job ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#122641] bg-[#08182a] p-3">
          <span className="rounded-md bg-indigo-500/10 px-2 py-1 font-mono text-[9px] text-indigo-300">#{job.version}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[9px] font-medium text-slate-300">{activeJobId}</p>
            <p className="mt-0.5 text-[8px] text-slate-600">{new Date(job.updatedAt).toLocaleString("de-DE")}</p>
          </div>
          <StatusPill tone={job.status === "completed" ? "success" : job.status === "failed" ? "danger" : "violet"}>
            {job.status}
          </StatusPill>
        </div>
      ) : (
        <p className="text-[9px] text-slate-600">Noch kein aktiver Factory-Run.</p>
      )}
    </Panel>
  );
}

function LogPanel({
  job,
  report,
  productionMetrics,
}: {
  job: FactoryJob | null;
  report: TestReportV1 | null;
  productionMetrics: WorkflowProductionMetrics | null;
}) {
  const lines: Array<[string, string]> = [];
  if (job !== null) {
    lines.push([new Date(job.updatedAt).toLocaleTimeString("de-DE"), `Factory status: ${job.status}`]);
  }
  if (report !== null && job !== null) {
    lines.push([new Date(job.updatedAt).toLocaleTimeString("de-DE"), `TestReportV1: ${report.result}`]);
  }
  if (productionMetrics !== null) {
    lines.push([new Date(productionMetrics.updatedAt).toLocaleTimeString("de-DE"), `Production metrics updated · ${productionMetrics.modelCalls} model / ${productionMetrics.agentCalls} agent calls`]);
  }

  return (
    <Panel title="System Logs" action={<span className="text-[9px] text-emerald-400">Live snapshot</span>}>
      <div className="space-y-2 font-mono text-[8px]">
        {lines.length === 0 ? (
          <p className="text-slate-600">Keine Laufereignisse im aktuellen Snapshot.</p>
        ) : (
          lines.map(([time, message], index) => (
            <div key={`${time}-${index}`} className="grid grid-cols-[52px_1fr] gap-2 border-b border-[#10213a] pb-2 text-slate-500 last:border-0 last:pb-0">
              <span>{time}</span>
              <span className="text-slate-300">{message}</span>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

export function CommandCenter({
  metrics,
  activeJobId,
  job,
  gate,
  testReport,
  productionMetrics,
  intentPosture,
  intentValue,
  onIntentChange,
  onIntentSubmit,
  inputRef,
  approvalVersion,
  approvalBusy,
  approvalConflict,
  onApproval,
}: CommandCenterProps) {
  const runtimeActive = metrics.edgeComputeActive;

  return (
    <div className="min-h-dvh bg-[#030812] text-slate-200">
      <div className="flex min-h-dvh">
        <Sidebar metrics={metrics} job={job} report={testReport} productionMetrics={productionMetrics} />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex h-[72px] items-center gap-4 border-b border-[#15243f] bg-[#050d18]/95 px-4 backdrop-blur-xl sm:px-5">
            <div className="min-w-0 flex-1">
              <IntentNode
                posture={intentPosture}
                value={intentValue}
                onValueChange={onIntentChange}
                onSubmit={onIntentSubmit}
                {...(inputRef ? { inputRef } : {})}
                placeholder="Workflows, Runs, Agenten, Logs …"
              />
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className={`rounded-xl border px-3 py-2 ${runtimeActive ? "border-emerald-500/20 bg-emerald-500/[0.06]" : "border-slate-700 bg-slate-900/70"}`}>
                <div className={`flex items-center gap-2 text-[9px] font-semibold ${runtimeActive ? "text-emerald-300" : "text-slate-500"}`}>
                  <span className={`size-2 rounded-full ${runtimeActive ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.6)]" : "bg-slate-600"}`} />
                  {runtimeActive ? "Runtime Active" : "Runtime Idle"}
                </div>
                <p className="mt-0.5 text-[7px] text-slate-600">Factory control surface</p>
              </div>
              <div className="grid size-9 place-items-center rounded-full border border-indigo-500/25 bg-indigo-500/10 text-[10px] font-semibold text-indigo-200">SO</div>
            </div>
          </header>

          <main className="p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-4 px-1 py-1">
              <div>
                <p className="text-[8px] font-semibold tracking-[0.16em] text-slate-600 uppercase">Willkommen zurück</p>
                <h1 className="mt-1 text-[24px] font-bold tracking-[-0.035em] text-white">
                  CRAFTFLOW <span className="bg-[linear-gradient(90deg,#818CF8,#A855F7)] bg-clip-text text-transparent">Command Center</span>
                </h1>
                <p className="mt-1 text-[10px] text-slate-500">Workflows entwickeln. Mit KI ausführen. Automatisch testen. Sicher deployen.</p>
              </div>

              <div className="flex items-stretch gap-3">
                <div className="min-w-[86px] text-right">
                  <p className="font-mono text-[9px] text-slate-600">{new Date(metrics.sampledAt).toLocaleDateString("de-DE")}</p>
                  <p className="mt-1 text-[18px] font-semibold text-slate-200">{new Date(metrics.sampledAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                {job !== null && (
                  <div className="hidden min-w-[225px] items-center justify-between rounded-xl border border-[#203657] bg-[#0a1728] px-3 py-2 md:flex">
                    <div className="min-w-0">
                      <p className="text-[7px] uppercase tracking-[0.1em] text-indigo-400">Aktiver Workflow</p>
                      <p className="mt-1 max-w-[165px] truncate text-[10px] font-semibold text-slate-200">{activeJobId}</p>
                      <p className="mt-1 text-[8px] text-emerald-300">{job.status}</p>
                    </div>
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[linear-gradient(135deg,#4338CA,#4F46E5)] text-white shadow-[0_0_18px_rgba(79,70,229,.25)]">→</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-3">
                <WorkflowCore job={job} activeJobId={activeJobId} />

                <div className="grid gap-3 lg:grid-cols-3">
                  <TestPanel report={testReport} productionMetrics={productionMetrics} />
                  <CostPanel metrics={productionMetrics} />
                  <GatePanel
                    gate={gate}
                    approvalVersion={approvalVersion}
                    approvalBusy={approvalBusy}
                    approvalConflict={approvalConflict}
                    onApproval={onApproval}
                  />
                </div>

                <EvidencePanel report={testReport} job={job} productionMetrics={productionMetrics} />
              </div>

              <div className="space-y-3">
                <RuntimePanel job={job} gate={gate} report={testReport} productionMetrics={productionMetrics} />
                <RunsPanel job={job} activeJobId={activeJobId} />
                <LogPanel job={job} report={testReport} productionMetrics={productionMetrics} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
