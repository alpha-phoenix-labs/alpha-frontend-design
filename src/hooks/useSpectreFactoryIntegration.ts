import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ApiError,
  FactoryJob,
  FactoryResult,
  FactoryTestReport,
  HumanGateState,
  TestReportV1,
  WorkflowRequest,
} from '@/types/factory/index.ts';
import type { SubmitApprovalInput, SubmitClarificationInput } from '@/services/factory/index.ts';
import {
  useActiveFactoryJob,
  useActiveFactoryJobId,
  useFactoryActions,
  useFactoryLastError,
  useFactoryStore,
  useHumanGateState,
  useTestResult,
} from '@/store/factory/index.ts';
import { useFactoryJobPolling } from '@/hooks/useFactoryJobPolling.ts';

export const FACTORY_JOB_STORAGE_KEY = 'craftflow.factory.activeJobId.v1';

export type FactoryMutationKind = 'prompt' | 'clarification' | 'approval' | 'recovery';

export class FactoryMutationLatch {
  readonly #active = new Set<FactoryMutationKind>();

  begin(kind: FactoryMutationKind): boolean {
    if (this.#active.has(kind)) {
      return false;
    }
    this.#active.add(kind);
    return true;
  }

  end(kind: FactoryMutationKind): void {
    this.#active.delete(kind);
  }

  isActive(kind: FactoryMutationKind): boolean {
    return this.#active.has(kind);
  }
}

export interface ApprovalGateSnapshot {
  readonly jobId: string;
  readonly version: number;
}

export function approvalSnapshotFor(
  job: FactoryJob | null,
  gate: HumanGateState | null,
): ApprovalGateSnapshot | null {
  return job !== null && gate?.type === 'approval' && gate.status === 'awaiting_human' && gate.jobId === job.id
    ? { jobId: job.id, version: job.version }
    : null;
}

export function approvalInputFromSnapshot(snapshot: ApprovalGateSnapshot, approve: boolean): SubmitApprovalInput {
  return { jobId: snapshot.jobId, version: snapshot.version, approve };
}

export function clarificationInput(jobId: string, draft: string): SubmitClarificationInput | null {
  const response = draft.trim();
  return jobId.trim() === '' || response === '' ? null : { jobId, response };
}

export function publicTestReport(report: FactoryTestReport | null): TestReportV1 | null {
  return report !== null && 'contractVersion' in report ? report : null;
}

export function readStoredFactoryJobId(storage: Pick<Storage, 'getItem'>): string | null {
  try {
    const value = storage.getItem(FACTORY_JOB_STORAGE_KEY)?.trim() ?? '';
    return value === '' ? null : value;
  } catch {
    return null;
  }
}

export function writeStoredFactoryJobId(
  storage: Pick<Storage, 'setItem' | 'removeItem'>,
  jobId: string | null,
): void {
  try {
    if (jobId === null) {
      storage.removeItem(FACTORY_JOB_STORAGE_KEY);
    } else {
      storage.setItem(FACTORY_JOB_STORAGE_KEY, jobId);
    }
  } catch {
    // Storage availability must never break the Factory flow.
  }
}

/**
 * Two sequential refreshes guarantee the second read starts after any joined in-flight GET has settled.
 * This is read-only recovery; the uncertain mutation itself is never replayed.
 */
export async function refreshAfterUnconfirmedMutation(
  refreshJob: (jobId: string) => Promise<void>,
  jobId: string,
): Promise<void> {
  await refreshJob(jobId);
  await refreshJob(jobId);
}

type BusyReporter = (busy: boolean) => void;
type SubmitPrompt = (request: WorkflowRequest) => Promise<FactoryResult<FactoryJob>>;
type SubmitClarification = (input: SubmitClarificationInput) => Promise<FactoryResult<FactoryJob>>;
type SubmitApproval = (input: SubmitApprovalInput) => Promise<FactoryResult<FactoryJob>>;

export async function submitPromptOnce(
  latch: FactoryMutationLatch,
  submit: SubmitPrompt,
  text: string,
  onBusy?: BusyReporter,
): Promise<FactoryResult<FactoryJob> | null> {
  const description = text.trim();
  if (description === '' || !latch.begin('prompt')) {
    return null;
  }
  onBusy?.(true);
  try {
    // WorkflowRequest.testMode is a frozen legacy service field; HttpFactoryService sends only the prompt.
    return await submit({ description, testMode: 'mock' });
  } finally {
    latch.end('prompt');
    onBusy?.(false);
  }
}

export async function submitClarificationOnce(
  latch: FactoryMutationLatch,
  submit: SubmitClarification,
  jobId: string,
  draft: string,
  onBusy?: BusyReporter,
): Promise<FactoryResult<FactoryJob> | null> {
  const input = clarificationInput(jobId, draft);
  if (input === null || !latch.begin('clarification')) {
    return null;
  }
  onBusy?.(true);
  try {
    return await submit(input);
  } finally {
    latch.end('clarification');
    onBusy?.(false);
  }
}

export async function submitApprovalOnce(
  latch: FactoryMutationLatch,
  submit: SubmitApproval,
  snapshot: ApprovalGateSnapshot,
  approve: boolean,
  onBusy?: BusyReporter,
): Promise<FactoryResult<FactoryJob> | null> {
  if (!latch.begin('approval')) {
    return null;
  }
  onBusy?.(true);
  try {
    return await submit(approvalInputFromSnapshot(snapshot, approve));
  } finally {
    latch.end('approval');
    onBusy?.(false);
  }
}

export interface SpectreFactoryIntegration {
  readonly activeJobId: string | null;
  readonly activeJob: FactoryJob | null;
  readonly humanGate: HumanGateState | null;
  readonly testReport: TestReportV1 | null;
  readonly lastError: ApiError | null;
  readonly clarificationDraft: string;
  readonly setClarificationDraft: (value: string) => void;
  readonly approvalVersion: number | null;
  readonly approvalConflict: boolean;
  readonly promptBusy: boolean;
  readonly clarificationBusy: boolean;
  readonly approvalBusy: boolean;
  readonly recoveryBusy: boolean;
  readonly mutationUnconfirmed: boolean;
  readonly submitPrompt: (text: string) => Promise<boolean>;
  readonly submitClarification: () => Promise<void>;
  readonly submitApproval: (approve: boolean) => Promise<void>;
  readonly recoverMutation: () => Promise<void>;
}

export function useSpectreFactoryIntegration(): SpectreFactoryIntegration {
  const activeJobId = useActiveFactoryJobId();
  const activeJob = useActiveFactoryJob();
  const humanGate = useHumanGateState(activeJobId);
  const storedTestReport = useTestResult(activeJobId);
  const lastError = useFactoryLastError();
  const {
    submitWorkflowRequest,
    submitClarification: submitClarificationAction,
    submitApproval: submitApprovalAction,
    refreshJob,
    setActiveJob,
    clearLastError,
  } = useFactoryActions();

  const latchRef = useRef(new FactoryMutationLatch());
  const draftJobIdRef = useRef<string | null>(activeJobId);
  const [clarificationDraft, setClarificationDraft] = useState('');
  const [approvalSnapshot, setApprovalSnapshot] = useState<ApprovalGateSnapshot | null>(null);
  const [approvalConflict, setApprovalConflict] = useState(false);
  const [promptBusy, setPromptBusy] = useState(false);
  const [clarificationBusy, setClarificationBusy] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [recoveryBusy, setRecoveryBusy] = useState(false);

  useFactoryJobPolling(activeJobId, activeJob?.status ?? null);

  useEffect(() => {
    if (draftJobIdRef.current !== activeJobId) {
      draftJobIdRef.current = activeJobId;
      setClarificationDraft('');
    }
  }, [activeJobId]);

  useEffect(() => {
    const candidate = approvalSnapshotFor(activeJob, humanGate);
    if (candidate === null) {
      setApprovalSnapshot(null);
      setApprovalConflict(false);
      return;
    }
    // Keep the first rendered version pinned while this same approval gate remains visible.
    setApprovalSnapshot((current) => (current?.jobId === candidate.jobId ? current : candidate));
  }, [activeJob, humanGate]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (activeJobId === null) {
      const storedJobId = readStoredFactoryJobId(window.sessionStorage);
      if (storedJobId !== null) {
        setActiveJob(storedJobId);
        void refreshJob(storedJobId);
        return;
      }
    }
    writeStoredFactoryJobId(window.sessionStorage, activeJobId);
  }, [activeJobId, refreshJob, setActiveJob]);

  const submitPrompt = useCallback(
    async (text: string): Promise<boolean> => {
      clearLastError();
      const result = await submitPromptOnce(latchRef.current, submitWorkflowRequest, text, setPromptBusy);
      return result?.ok === true;
    },
    [clearLastError, submitWorkflowRequest],
  );

  const submitClarification = useCallback(async (): Promise<void> => {
    if (activeJobId === null || humanGate?.type !== 'clarification') {
      return;
    }
    clearLastError();
    const result = await submitClarificationOnce(
      latchRef.current,
      submitClarificationAction,
      activeJobId,
      clarificationDraft,
      setClarificationBusy,
    );
    if (result?.ok === true) {
      setClarificationDraft('');
    }
  }, [activeJobId, clarificationDraft, clearLastError, humanGate, submitClarificationAction]);

  const submitApproval = useCallback(
    async (approve: boolean): Promise<void> => {
      if (approvalSnapshot === null) {
        return;
      }
      clearLastError();
      const result = await submitApprovalOnce(
        latchRef.current,
        submitApprovalAction,
        approvalSnapshot,
        approve,
        setApprovalBusy,
      );
      if (result === null) {
        return;
      }
      if (result.ok) {
        setApprovalSnapshot(null);
        setApprovalConflict(false);
        return;
      }
      if (result.error.code === 'VERSION_CONFLICT') {
        // The store performs the required refresh before returning. Bind a new visible gate snapshot;
        // never reuse the user's previous decision against this newer version.
        const state = useFactoryStore.getState();
        const latestJob = state.jobs[approvalSnapshot.jobId] ?? null;
        const latestGate = state.humanGates[approvalSnapshot.jobId] ?? null;
        setApprovalSnapshot(approvalSnapshotFor(latestJob, latestGate));
        setApprovalConflict(true);
      }
    },
    [approvalSnapshot, clearLastError, submitApprovalAction],
  );

  const recoverMutation = useCallback(async (): Promise<void> => {
    if (activeJobId === null || !latchRef.current.begin('recovery')) {
      return;
    }
    setRecoveryBusy(true);
    clearLastError();
    try {
      await refreshAfterUnconfirmedMutation(refreshJob, activeJobId);
    } finally {
      latchRef.current.end('recovery');
      setRecoveryBusy(false);
    }
  }, [activeJobId, clearLastError, refreshJob]);

  return {
    activeJobId,
    activeJob,
    humanGate,
    testReport: publicTestReport(storedTestReport),
    lastError,
    clarificationDraft,
    setClarificationDraft,
    approvalVersion: approvalSnapshot?.version ?? null,
    approvalConflict,
    promptBusy,
    clarificationBusy,
    approvalBusy,
    recoveryBusy,
    mutationUnconfirmed: lastError?.code === 'MUTATION_UNCONFIRMED',
    submitPrompt,
    submitClarification,
    submitApproval,
    recoverMutation,
  };
}
