import type { Ref } from "react";
import type { IntentNodePosture, SystemMetrics } from "@/types/index.ts";
import type { FactoryJob, HumanGateState, TestReportV1 } from "@/types/factory/index.ts";
import { IntentNode } from "@/components/ui/IntentNode.tsx";

interface CommandCenterProps {
  metrics: SystemMetrics;
  activeJobId: string | null;
  job: FactoryJob | null;
  gate: HumanGateState | null;
  testReport: TestReportV1 | null;
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
  { key: "build", label: "Workflow Build", short: "Workflow erzeugen" },
  { key: "n8n", label: "n8n", short: "Workflow aktiv" },
  { key: "tests", label: "Tests", short: "Automatisch testen" },
  { key: "repair", label: "Repair", short: "Fehler beheben" },
  { key: "gate", label: "Human Gate", short: "Freigabe erforderlich" },
  { key: "production", label: "Production", short: "Deploy & Monitor" },
  { key: "evidence", label: "Drive Evidence", short: "Nachweise sichern" },
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
    node: "border-cyan-400/55 bg-cyan-400/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,.16)]",
    dot: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.55)]",
    label: "text-slate-100",
  },
  active: {
    node: "border-violet-400/70 bg-violet-500/15 text-violet-200 shadow-[0_0_30px_rgba(124,58,237,.30)]",
    dot: "bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,.65)]",
    label: "text-white",
  },
  blocked: {
    node: "border-amber-400/70 bg-amber-500/10 text-amber-200 shadow-[0_0_26px_rgba(245,158,11,.18)]",
    dot: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,.55)]",
    label: "text-amber-100",
  },
  idle: {
    node: "border-slate-700 bg-slate-900/70 text-slate-500",
    dot: "bg-slate-600",
    label: "text-slate-400",
  },
};

function NodeGlyph({ index }: { index: number }) {
  const glyphs = ["⌁", "◈", "⌘", "∞", "△", "⌕", "◎", "⇧", "▣"];
  return <span className="font-mono text-[17px]">{glyphs[index]}</span>;
}

function StatusPill({ children, tone = "neutral" }: { children: string; tone?: "neutral" | "success" | "warning" | "danger" | "violet" }) {
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

  return <span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] ${cls}`}>{children}</span>;
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-[#172744] bg-[#07101f]/92 shadow-[0_14px_40px_rgba(0,0,0,.18)]">
      <div className="flex min-h-11 items-center justify-between border-b border-[#172744] px-4">
        <h3 className="text-[12px] font-semibold text-slate-100">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Sidebar() {
  const items = ["Übersicht", "Workflows", "Agenten", "Tests", "Deployments", "Drive Evidence", "Integrationen", "Kosten", "Analysen", "Einstellungen"];
  return (
    <aside className="hidden w-[205px] shrink-0 flex-col border-r border-[#15243f] bg-[#06101d]/95 lg:flex">
      <div className="flex h-[72px] items-center gap-3 border-b border-[#15243f] px-5">
        <div className="relative grid size-9 place-items-center">
          <div className="absolute size-8 rotate-45 rounded-[8px] bg-[linear-gradient(135deg,#22D3EE,#4F46E5_55%,#A855F7)] shadow-[0_0_22px_rgba(79,70,229,.36)]" />
          <div className="relative size-3 rotate-45 rounded-[3px] bg-[#07101f]" />
        </div>
        <div>
          <p className="text-[14px] font-extrabold tracking-[0.08em] text-white">CRAFT<span className="text-indigo-400">FLOW</span></p>
          <p className="mt-0.5 text-[7px] font-semibold tracking-[0.18em] text-slate-500 uppercase">AI Automation System</p>
        </div>
      </div>

      <nav className="space-y-1 px-3 py-4">
        {items.map((item, index) => (
          <button
            key={item}
            type="button"
            aria-current={index === 0 ? "page" : undefined}
            disabled={index !== 0}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] transition ${index === 0 ? "bg-[linear-gradient(90deg,#4338CA,#3730A3)] text-white shadow-[0_0_22px_rgba(79,70,229,.28)]" : "text-slate-400 disabled:cursor-default"}`}
          >
            <span className={`grid size-6 place-items-center rounded-lg border font-mono text-[10px] ${index === 0 ? "border-indigo-300/30 bg-white/10" : "border-slate-800 bg-slate-900/70"}`}>{String(index + 1).padStart(2, "0")}</span>
            {item}
          </button>
        ))}
      </nav>

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-[#1a3151] bg-[#08182a] p-4">
          <p className="text-[11px] font-semibold text-slate-200">System Status</p>
          <div className="mt-3 space-y-2 text-[10px] text-slate-400">
            {["Core Services", "n8n Runtime", "Agent Pool", "Test Runner", "Drive Connector"].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.65)]" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
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
            {job !== null && <StatusPill tone={job.status === "completed" ? "success" : job.status === "failed" ? "danger" : "success"}>{job.status}</StatusPill>}
          </div>
          <p className="mt-1 text-[10px] text-slate-500">Von Anforderung bis Evidence — statusgebunden, nachvollziehbar, fail-closed.</p>
        </div>
        <div className="flex items-center gap-2">
          {job !== null && <StatusPill tone="violet">v{job.version}</StatusPill>}
          <button type="button" disabled className="rounded-lg border border-[#203657] bg-[#0b1728] px-3 py-2 text-[10px] text-slate-500">Details</button>
        </div>
      </div>

      <div className="relative mt-5 overflow-hidden rounded-2xl border border-[#142744] bg-[#050d19] px-3 py-5">
        <div className="absolute inset-0 opacity-[0.16] [background-image:radial-gradient(circle,#38BDF8_1px,transparent_1px)] [background-size:19px_19px]" />
        <div className="absolute top-[52px] right-[5%] left-[5%] h-px bg-[linear-gradient(90deg,transparent,#22D3EE_12%,#6366F1_48%,#22D3EE_82%,transparent)] opacity-55" />
        <div className="relative grid grid-cols-3 gap-y-6 sm:grid-cols-5 lg:grid-cols-9">
          {pipeline.map((stage, index) => {
            const tone = stageTone(index, current, job);
            const cls = toneClasses[tone];
            return (
              <div key={stage.key} className="relative flex min-w-0 flex-col items-center text-center">
                <div className={`grid size-11 place-items-center rounded-2xl border ${cls.node}`}>
                  <NodeGlyph index={index} />
                </div>
                <span className={`mt-2 text-[10px] font-semibold ${cls.label}`}>{stage.label}</span>
                <span className="mt-0.5 hidden text-[8px] text-slate-600 xl:block">{stage.short}</span>
                <span className={`mt-2 size-1.5 rounded-full ${cls.dot}`} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="rounded-xl border border-[#152945] bg-[#091625] p-3">
          <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">Aktueller Status</p>
          <p data-testid="factory-status" className="mt-1 text-[12px] font-semibold text-slate-100">{job?.status ?? "idle"}</p>
          <p className="mt-0.5 text-[9px] text-slate-500">{job ? `Aktualisiert: ${new Date(job.updatedAt).toLocaleTimeString("de-DE")}` : "Bereit für neue Anforderung"}</p>
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

function RuntimePanel({ metrics, job }: { metrics: SystemMetrics; job: FactoryJob | null }) {
  const rows = [
    ["Edge Compute", metrics.edgeComputeActive ? "Active" : "Idle"],
    ["Inference Runtime", metrics.inferenceRuntime === "localSlm" ? "Local SLM" : metrics.inferenceRuntime],
    ["Memory", metrics.memoryArchitecture === "unified" ? "Unified" : metrics.memoryArchitecture],
    ["Factory Job", job?.status ?? "Idle"],
  ];
  return (
    <Panel title="Runtime / Agents" action={<span className="text-[9px] text-indigo-400">Live</span>}>
      <div className="space-y-2.5">
        {rows.map(([label, value], index) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-[#11253f] bg-[#08182a] px-3 py-2.5">
            <span className={`grid size-7 place-items-center rounded-lg border ${index === 3 ? "border-violet-500/25 bg-violet-500/10 text-violet-300" : "border-cyan-500/20 bg-cyan-500/10 text-cyan-300"}`}>
              <span className="size-1.5 rounded-full bg-current" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-medium text-slate-300">{label}</p>
              <p className="mt-0.5 truncate font-mono text-[8px] text-slate-600">{value}</p>
            </div>
            <span className="size-1.5 rounded-full bg-emerald-400" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function TestPanel({ report }: { report: TestReportV1 | null }) {
  const tone = report?.result === "PASS" ? "success" : report?.result === "NOT_PASS" ? "danger" : "neutral";
  return (
    <Panel title="Tests / Repair" action={<span className="text-[9px] text-slate-600">TestReportV1</span>}>
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center rounded-full border-[8px] border-[#152945] bg-[#081524]">
          <div className="text-center">
            <p className="text-[14px] font-bold text-white">{report?.result ?? "—"}</p>
            <p className="text-[8px] text-slate-600">result</p>
          </div>
        </div>
        <div className="min-w-0 space-y-2 text-[9px]">
          <div className="flex items-center gap-2"><StatusPill tone={tone}>{report?.result ?? "NOT RUN"}</StatusPill></div>
          <p className="truncate text-slate-500">Reason: <span className="text-slate-300">{report?.reason ?? "—"}</span></p>
          <p className="truncate text-slate-500">Execution: <span className="font-mono text-slate-300">{report?.executionId ?? "—"}</span></p>
        </div>
      </div>
    </Panel>
  );
}

function CostPanel() {
  return (
    <Panel title="Kosten / Token / Dauer" action={<span className="text-[9px] text-slate-600">Runtime source required</span>}>
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Kosten", "—"],
          ["Tokens", "—"],
          ["Laufzeit", "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-[#122641] bg-[#08182a] p-3">
            <p className="text-[8px] uppercase tracking-[0.1em] text-slate-600">{label}</p>
            <p className="mt-2 font-mono text-[15px] font-semibold text-slate-300">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[8px] leading-4 text-slate-600">Keine Produktionsmetrik wird erfunden. Anzeige aktiviert sich erst mit Runtime-Evidence.</p>
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
          {awaiting ? `Approval-Version ${approvalVersion ?? "—"} ist an den sichtbaren Gate-Snapshot gebunden.` : "Craftflow fährt ohne offenen Human Gate fort."}
        </p>
        {approvalConflict && <p className="mt-2 text-[8px] text-amber-300">Version geändert — Entscheidung erneut prüfen.</p>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onApproval(false)}
            disabled={!awaiting || approvalBusy || approvalVersion === null}
            className="rounded-lg border border-rose-500/25 bg-rose-500/[0.06] px-3 py-2 text-[9px] font-semibold text-rose-300 disabled:opacity-30"
          >
            Ablehnen
          </button>
          <button
            type="button"
            onClick={() => onApproval(true)}
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

function EvidencePanel({ report, job }: { report: TestReportV1 | null; job: FactoryJob | null }) {
  const entries = [
    ["Job Status", job?.status ?? "—"],
    ["Test Evidence", report?.evidence ?? "—"],
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
          <StatusPill tone={job.status === "completed" ? "success" : job.status === "failed" ? "danger" : "violet"}>{job.status}</StatusPill>
        </div>
      ) : (
        <p className="text-[9px] text-slate-600">Noch kein aktiver Factory-Run.</p>
      )}
    </Panel>
  );
}

function LogPanel({ job, report }: { job: FactoryJob | null; report: TestReportV1 | null }) {
  const lines = [
    job ? [new Date(job.updatedAt).toLocaleTimeString("de-DE"), `Factory status: ${job.status}`] : null,
    report ? [new Date().toLocaleTimeString("de-DE"), `TestReportV1: ${report.result}`] : null,
  ].filter(Boolean) as string[][];

  return (
    <Panel title="System Logs" action={<span className="text-[9px] text-emerald-400">Live snapshot</span>}>
      <div className="space-y-2 font-mono text-[8px]">
        {lines.length === 0 ? (
          <p className="text-slate-600">Keine Laufereignisse im aktuellen Snapshot.</p>
        ) : (
          lines.map(([time, message]) => (
            <div key={`${time}-${message}`} className="grid grid-cols-[52px_1fr] gap-2 border-b border-[#10213a] pb-2 text-slate-500 last:border-0 last:pb-0">
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
  return (
    <div className="min-h-dvh bg-[#030812] text-slate-200">
      <div className="flex min-h-dvh">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex h-[72px] items-center gap-4 border-b border-[#15243f] bg-[#050d18]/95 px-4 backdrop-blur-xl sm:px-5">
            <div className="min-w-0 flex-1">
              <IntentNode
                posture={intentPosture}
                value={intentValue}
                onValueChange={onIntentChange}
                onSubmit={onIntentSubmit}
                inputRef={inputRef}
                placeholder="Workflows, Runs, Agenten, Logs …"
              />
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2">
                <div className="flex items-center gap-2 text-[9px] font-semibold text-emerald-300">
                  <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.6)]" />
                  System Online
                </div>
                <p className="mt-0.5 text-[7px] text-slate-600">Runtime snapshot available</p>
              </div>
              <div className="grid size-9 place-items-center rounded-full border border-indigo-500/25 bg-indigo-500/10 text-[10px] font-semibold text-indigo-200">SO</div>
            </div>
          </header>

          <main className="p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3 rounded-[18px] border border-[#14243e] bg-[#07101e]/80 px-4 py-4">
              <div>
                <p className="text-[8px] font-semibold tracking-[0.16em] text-slate-600 uppercase">Willkommen zurück</p>
                <h1 className="mt-1 text-[24px] font-bold tracking-[-0.035em] text-white">
                  CRAFTFLOW <span className="bg-[linear-gradient(90deg,#818CF8,#A855F7)] bg-clip-text text-transparent">Command Center</span>
                </h1>
                <p className="mt-1 text-[10px] text-slate-500">Workflows entwickeln. Mit KI ausführen. Automatisch testen. Sicher deployen.</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[9px] text-slate-600">{new Date(metrics.sampledAt).toLocaleDateString("de-DE")}</p>
                <p className="mt-1 text-[18px] font-semibold text-slate-200">{new Date(metrics.sampledAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-3">
                <WorkflowCore job={job} activeJobId={activeJobId} />

                <div className="grid gap-3 lg:grid-cols-3">
                  <TestPanel report={testReport} />
                  <CostPanel />
                  <GatePanel
                    gate={gate}
                    approvalVersion={approvalVersion}
                    approvalBusy={approvalBusy}
                    approvalConflict={approvalConflict}
                    onApproval={onApproval}
                  />
                </div>

                <EvidencePanel report={testReport} job={job} />
              </div>

              <div className="space-y-3">
                <RuntimePanel metrics={metrics} job={job} />
                <RunsPanel job={job} activeJobId={activeJobId} />
                <LogPanel job={job} report={testReport} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
