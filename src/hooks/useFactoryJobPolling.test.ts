import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FACTORY_POLL_INTERVAL_MS,
  shouldPollFactoryJob,
  startFactoryJobPolling,
} from '@/hooks/useFactoryJobPolling.ts';

afterEach(() => {
  vi.useRealTimers();
});

describe('factory polling lifecycle', () => {
  it.each(['queued', 'generating', 'generated', 'testing', 'approved', 'awaiting_human'] as const)(
    'polls while status is %s',
    (status) => {
      expect(shouldPollFactoryJob('job-1', status)).toBe(true);
    },
  );

  it.each(['completed', 'failed', 'blocked'] as const)('does not poll terminal status %s', (status) => {
    expect(shouldPollFactoryJob('job-1', status)).toBe(false);
  });

  it('starts immediately for an active job and then follows the interval', async () => {
    vi.useFakeTimers();
    const refresh = vi.fn(() => Promise.resolve());
    const stop = startFactoryJobPolling('job-1', 'generating', refresh);

    expect(refresh).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(FACTORY_POLL_INTERVAL_MS);
    expect(refresh).toHaveBeenCalledTimes(2);
    stop();
  });

  it('cleanup models unmount and leaves no zombie timer', async () => {
    vi.useFakeTimers();
    const refresh = vi.fn(() => Promise.resolve());
    const stop = startFactoryJobPolling('job-1', 'testing', refresh);

    stop();
    await vi.advanceTimersByTimeAsync(FACTORY_POLL_INTERVAL_MS * 3);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('job switch cleanup stops the old job before the new loop starts', async () => {
    vi.useFakeTimers();
    const refresh = vi.fn(() => Promise.resolve());

    const stopOld = startFactoryJobPolling('job-old', 'generating', refresh);
    stopOld();
    const stopNew = startFactoryJobPolling('job-new', 'generating', refresh);
    await vi.advanceTimersByTimeAsync(FACTORY_POLL_INTERVAL_MS);

    expect(refresh.mock.calls.map(([jobId]) => jobId)).toEqual(['job-old', 'job-new', 'job-new']);
    stopNew();
  });

  it('starts no timer without a job id or for idle/terminal jobs', async () => {
    vi.useFakeTimers();
    const refresh = vi.fn(() => Promise.resolve());

    startFactoryJobPolling(null, 'generating', refresh);
    startFactoryJobPolling('job-1', 'idle', refresh);
    startFactoryJobPolling('job-1', 'completed', refresh);
    await vi.advanceTimersByTimeAsync(FACTORY_POLL_INTERVAL_MS * 2);

    expect(refresh).not.toHaveBeenCalled();
  });
});
