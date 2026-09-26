import type { ApiError, FactoryJob, HumanGateState, TestReportV1 } from '@/types/factory/index.ts';

export interface FactoryWorkflowModuleProps {
  readonly activeJobId: string;
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
      <span className="font-mono text-spatial-dim uppercase">{label}</span>
      <span className="break-all text-white/80">{value}</span>
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
    <section className="glass-panel pointer-events-auto relative w-full max-w-[760px] rounded-[2rem] p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.18em] text-spatial-dim uppercase">Craftflow Factory</p>
          <h2 className="mt-2 text-lg font-medium text-white">Workflow production</h2>
          <p className="mt-1 break-all font-mono text-[10px] text-white/30">{activeJobId}</p>
        </div>
        {job === null ? (
          <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] text-spatial-dim uppercase">
            Loading snapshot
          </span>
        ) : (
          <div className="text-right">
            <span
              data-testid="factory-status"
              className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] text-white/70 uppercase"
            >
              {job.status}
            </span>
            <p className="mt-2 font-mono text-[9px] text-spatial-dim">job version {job.version}</p>
          </div>
        )}
      </div>

      {job?.error !== undefined && (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-xs text-red-100/80">
          <p className="font-mono text-[10px] uppercase">{job.error.code}</p>
          <p className="mt-1">{job.error.message}</p>
        </div>
      )}

      {lastError !== null && (
        <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4 text-xs text-amber-100/80">
          <p className="font-mono text-[10px] uppercase">{lastError.code}</p>
          <p className="mt-1">{lastError.message}</p>
          {mutationUnconfirmed && (
            <button
              type="button"
              onClick={onRecoverMutation}
              disabled={recoveryBusy}
              className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white transition-colors hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
            >
              {recoveryBusy ? 'Refreshing status…' : 'Refresh status'}
            </button>
          )}
        </div>
      )}

      {gate?.type === 'clarification' && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <p className="font-mono text-[10px] tracking-widest text-spatial-dim uppercase">Clarification required</p>
          <p className="mt-3 text-sm leading-6 text-white/90">{gate.question}</p>
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              value={clarificationDraft}
              onChange={(event) => onClarificationDraftChange(event.target.value)}
              placeholder="Your answer"
              aria-label="Clarification answer"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/20"
            />
            <button
              type="button"
              onClick={onSubmitClarification}
              disabled={clarificationBusy || clarificationDraft.trim() === ''}
              className="rounded-xl bg-white px-4 py-3 text-xs font-medium text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            >
              {clarificationBusy ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {gate?.type === 'approval' && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] tracking-widest text-spatial-dim uppercase">Approval gate</p>
              <p className="mt-2 text-sm text-white/90">
                Review this gate before approving or rejecting the workflow.
              </p>
            </div>
            {approvalVersion !== null && (
              <span
                data-testid="approval-version"
                className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] text-white/70"
              >
                version {approvalVersion}
              </span>
            )}
          </div>
          {approvalConflict && (
            <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs text-amber-100/80">
              The gate changed. Review the newly displayed version and make a new decision.
            </p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => onApproval(false)}
              disabled={approvalBusy || approvalVersion === null}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-xs text-white/70 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => onApproval(true)}
              disabled={approvalBusy || approvalVersion === null}
              className="flex-1 rounded-xl bg-white py-3 text-xs font-medium text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
            >
              {approvalBusy ? 'Submitting…' : 'Approve'}
            </button>
          </div>
        </div>
      )}

      {testReport !== null && (
        <div data-testid="test-report-v1" className="rounded-2xl border border-white/10 bg-black/10 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] tracking-widest text-spatial-dim uppercase">TestReportV1</p>
            <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] text-white/80">
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
