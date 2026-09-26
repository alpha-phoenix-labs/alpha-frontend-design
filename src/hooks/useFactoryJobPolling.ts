import { useEffect } from 'react';
import { useFactoryActions } from '@/store/factory/index.ts';

/** Default polling interval for factory job updates in milliseconds. */
export const FACTORY_POLL_INTERVAL_MS = 1000;

/** Refreshes a factory job immediately and then periodically while `jobId` is set. */
export function useFactoryJobPolling(jobId: string | null, intervalMs: number = FACTORY_POLL_INTERVAL_MS): void {
  const { refreshJob } = useFactoryActions();

  useEffect(() => {
    if (jobId === null) {
      return undefined;
    }
    void refreshJob(jobId);
    const timer = setInterval(() => {
      void refreshJob(jobId);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [jobId, intervalMs, refreshJob]);
}
