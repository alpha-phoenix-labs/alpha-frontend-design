import { useCallback, useEffect, useRef } from 'react';
import type { AmbientActionKind, AmbientNotification } from '@/types/index.ts';
import { useActiveNotification, useAmbientActions } from '@/store/index.ts';
import { playUiSound } from '@/hooks/useUiSound.ts';

/** Delay of the simulated ambient task from the reference (6 s). */
export const AMBIENT_SIMULATION_DELAY_MS = 6000;

/** The voice-memo notification of the reference; `createdAt` is set on delivery. */
export const AMBIENT_VOICE_MEMO_NOTIFICATION: Omit<AmbientNotification, 'createdAt'> = {
  id: 'ambient-voice-memo-draft',
  source: 'voiceMemo',
  title: 'Ambient Interpretation',
  message: 'Voice memo from client processed. Extracted measurements and generated initial draft.',
  actions: [
    { kind: 'dismiss', label: 'Dismiss' },
    { kind: 'review', label: 'Review Draft' },
  ],
};

export interface AmbientSimulationOptions {
  readonly enabled?: boolean;
  readonly delayMs?: number;
  /** Called after a "review" action, e.g. to focus the intent input. */
  readonly onReview?: (notification: AmbientNotification) => void;
}

/**
 * Props-compatible with AmbientNotificationCard. `onAction('dismiss')` removes the card;
 * `onAction('review')` removes it, writes "Reviewing Draft..." into the intent input and requests focus.
 */
export interface AmbientSimulation {
  readonly notification: AmbientNotification | null;
  readonly onAction: (kind: AmbientActionKind, notificationId: string) => void;
}

/**
 * Delivers the reference voice-memo notification once per session after the delay.
 * Timers are cleared on unmount; re-delivery is prevented by the ambient slice.
 */
export function useAmbientSimulation(options: AmbientSimulationOptions = {}): AmbientSimulation {
  const { enabled = true, delayMs = AMBIENT_SIMULATION_DELAY_MS, onReview } = options;
  const notification = useActiveNotification();
  const { pushNotification, dismissNotification, reviewNotification } = useAmbientActions();
  const onReviewRef = useRef(onReview);

  useEffect(() => {
    onReviewRef.current = onReview;
  }, [onReview]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const timer = setTimeout(() => {
      const delivered = pushNotification({ ...AMBIENT_VOICE_MEMO_NOTIFICATION, createdAt: new Date().toISOString() });
      if (delivered) {
        playUiSound('ambientChime');
      }
    }, delayMs);
    return () => clearTimeout(timer);
  }, [enabled, delayMs, pushNotification]);

  const onAction = useCallback(
    (kind: AmbientActionKind, notificationId: string) => {
      if (kind === 'dismiss') {
        dismissNotification(notificationId);
        return;
      }
      const target = notification !== null && notification.id === notificationId ? notification : null;
      reviewNotification(notificationId);
      if (target !== null) {
        onReviewRef.current?.(target);
      }
    },
    [dismissNotification, notification, reviewNotification],
  );

  return { notification, onAction };
}
