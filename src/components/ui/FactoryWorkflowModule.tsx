import type { ApiError, FactoryJob, HumanGateState, TestReportV1 } from '@/types/factory/index.ts';

export interface FactoryWorkflowModuleProps {
  readonly activeJobId: string | null;
  readonly job: FactoryJob | null;
  readonly gate: HumanGateState | null;
  readonly testReport: TestReportV1 | null;
  readonly lastError: ApiError | null;
  readonly clarificationDraft: string;
  readonly onClarificationDraftChange: (value: string) => void;
  readonly onSubmitClarification: () => void;
  readonly approvalVersion: number | null;
  readonly approvalConflict: boolean;
  readonly onApproval: (approve: boolean) => void;
  readonly clarificationBusy: boolean;
  readonly approvalBusy: boolean;
  readonly mutationUnconfirmed: boolean;
  readonly recoveryBusy: boolean;
  readonly onRecoverMutation: () => void;
}

function ReportField({ label, value }: { readonly label: string; readonly value: string | undefined }) {
  return value === undefined ? null : (
    <div className="grid grid-cols-[7rem_1fr] gap-3 text-xs">
      <span className="font-mono text-slate-400 uppercase">{label}</span>
      <span className="break-all text-slate-700">{value}</span>
    </div>
  );
}

export function FactoryWorkflowModule({
  activeJobId,
  job,
  gate,
  testReport,
  lastError,
  clarificationDraft,
  onClarificationDraftChange,
  onSubmitClarification,
  approvalVersion,
  approvalConflict,
  onApproval,
  clarificationBusy,
  approvalBusy,
  mutationUnconfirmed,
  recoveryBusy,
  onRecoverMutation,
}: FactoryWorkflowModuleProps) {
  return (
    <section className="glass-panel pointer-events-auto relative w-full max-w-[820px] rounded-[2rem] p-6 sm:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <p className="font-mono text-[10px] font-medium tracking-[0.18em] text-indigo-500 uppercase">Craftflow Factory</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-slate-950">Workflow production</h2>
          <p className="mt-1 break-all font-mono text-[10px] text-slate-400">{activeJobId ?? 'No job created'}</p>
        </div>
        {job === null ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-[10px] text-slate-500 uppercase">
            Loading snapshot
          </span>
        ) : (
          <div className="text-right">
            <span
              data-testid="factory-status"
              className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 font-mono text-[10px] font-medium text-indigo-700 uppercase"
            >
              {job.status}
            </span>
            <p className="mt-2 font-mono text-[9px] text-slate-400">job version {job.version}</p>
          </div>
        )}
      </div>

      {job?.error !== undefined && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <p className="font-mono text-[10px] font-medium uppercase">{job.error.code}</p>
          <p className="mt-1">{job.error.message}</p>
        </div>
      )}

      {lastError !== null && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <p className="font-mono text-[10px] font-medium uppercase">{lastError.code}</p>
          <p className="mt-1">{lastError.message}</p>
          {mutationUnconfirmed && (
            <button
              type="button"
              onClick={onRecoverMutation}
              disabled={recoveryBusy}
              className="mt-3 rounded-xl border border-amber-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-amber-50 disabled:cursor-wait disabled:opacity-50"
            >
              {recoveryBusy ? 'Refreshing status…' : 'Refresh status'}
            </button>
          )}
        </div>
      )}

      {gate?.type === 'clarification' && (
        <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <p className="font-mono text-[10px] font-medium tracking-widest text-indigo-500 uppercase">Clarification required</p>
          <p className="mt-3 text-sm leading-6 text-slate-800">{gate.question}</p>
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={clarificationDraft}
              onChange={(event) => onClarificationDraftChange(event.target.value)}
              placeholder="Your answer"
              aria-label="Clarification answer"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={onSubmitClarification}
              disabled={clarificationBusy || clarificationDraft.trim() === ''}
              className="rounded-xl bg-indigo-600 px-4 py-3 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(79,70,229,.20)] transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {clarificationBusy ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {gate?.type === 'approval' && (
        <div className="mb-5 rounded-2xl border border-violet-100 bg-[linear-gradient(135deg,#F5F3FF,#FFFFFF)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-medium tracking-widest text-violet-600 uppercase">Approval gate</p>
              <p className="mt-2 text-sm text-slate-700">
                Review this gate before approving or rejecting the workflow.
              </p>
            </div>
            {approvalVersion !== null && (
              <span
                data-testid="approval-version"
                className="rounded-full border border-violet-200 bg-white px-3 py-1 font-mono text-[10px] text-violet-700"
              >
                version {approvalVersion}
              </span>
            )}
          </div>
          {approvalConflict && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              The gate changed. Review the newly displayed version and make a new decision.
            </p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => onApproval(false)}
              disabled={approvalBusy || approvalVersion === null}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => onApproval(true)}
              disabled={approvalBusy || approvalVersion === null}
              className="flex-1 rounded-xl bg-[linear-gradient(135deg,#4F46E5,#7C3AED)] py-3 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(79,70,229,.20)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {approvalBusy ? 'Submitting…' : 'Approve'}
            </button>
          </div>
        </div>
      )}

      {testReport !== null && (
        <div data-testid="test-report-v1" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] font-medium tracking-widest text-slate-400 uppercase">TestReportV1</p>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 font-mono text-[10px] font-medium text-emerald-700">
              {testReport.result}
            </span>
          </div>
          <div className="space-y-2">
            <ReportField label="reason" value={testReport.reason} />
            <ReportField label="importedId" value={testReport.importedId} />
            <ReportField label="executionId" value={testReport.executionId} />
            <ReportField label="evidence" value={testReport.evidence} />
          </div>
        </div>
      )}
    </section>
  );
}
