import { useEffect } from 'react';
import type { JobStatus } from '@/types/factory/index.ts';
import { useFactoryActions } from '@/store/factory/index.ts';

/** Default polling interval for factory job updates in milliseconds. */
export const FACTORY_POLL_INTERVAL_MS = 2_000;

/** Terminal states never need another periodic refresh. */
export const TERMINAL_FACTORY_STATUSES = ['completed', 'failed', 'blocked'] as const satisfies readonly JobStatus[];

export function shouldPollFactoryJob(jobId: string | null, status: JobStatus | null): boolean {
  return (
    jobId !== null &&
    status !== null &&
    status !== 'idle' &&
    !(TERMINAL_FACTORY_STATUSES as readonly JobStatus[]).includes(status)
  );
}

/**
 * Starts one immediate refresh plus a periodic refresh loop.
 * The returned cleanup is the single owner of the interval and is safe to call repeatedly.
 */
export function startFactoryJobPolling(
  jobId: string | null,
  status: JobStatus | null,
  refreshJob: (jobId: string) => Promise<void>,
  intervalMs: number = FACTORY_POLL_INTERVAL_MS,
): () => void {
  if (!shouldPollFactoryJob(jobId, status)) {
    return () => undefined;
  }

  void refreshJob(jobId);
  const timer = setInterval(() => {
    void refreshJob(jobId);
  }, intervalMs);

  return () => clearInterval(timer);
}

/**
 * Polls the active factory job while it is non-terminal.
 * React effect cleanup stops polling on terminal transitions, job changes and unmount.
 */
export function useFactoryJobPolling(
  jobId: string | null,
  status: JobStatus | null,
  intervalMs: number = FACTORY_POLL_INTERVAL_MS,
): void {
  const { refreshJob } = useFactoryActions();

  useEffect(
    () => startFactoryJobPolling(jobId, status, refreshJob, intervalMs),
    [jobId, status, intervalMs, refreshJob],
  );
}
