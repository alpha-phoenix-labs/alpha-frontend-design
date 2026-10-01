import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { ActiveModule, CostEstimate, IntentKind, IntentNodePosture, ModuleState } from '@/types/index.ts';
import {
  useActiveModule,
  useIntentActions,
  useIntentFocusRequest,
  useIntentNodePosture,
  useIntentText,
  useModuleState,
  useUiActions,
} from '@/store/index.ts';
import { getCostEstimate } from '@/services/estimate/costEstimateService.ts';
import { playUiSound } from '@/hooks/useUiSound.ts';
import { prefersReducedMotion } from '@/hooks/usePrefersReducedMotion.ts';

/** Keywords per intent kind from the reference, plus "kostet" so "Was kostet das?" opens the calculator; matched case-insensitively as substrings, in this order. */
export const INTENT_KEYWORDS = {
  calculator: ['kosten', 'kostet', 'preis', 'kalk'],
  spatialModel: ['3d', 'raum', 'bild'],
} as const satisfies Readonly<Record<IntentKind, readonly string[]>>;

/** Reference timing: the module exit animation (0.5 s) completes before the intent node returns. */
export const INTENT_TIMING = {
  moduleExitMs: 500,
} as const;

export { INTENT_STATUS_TEXT } from '@/store/index.ts';

const ROUTING_ORDER: readonly IntentKind[] = ['calculator', 'spatialModel'];

/**
 * Local modules answer short commands only ("kosten", "Was kostet das?", "3d").
 * R-08: a longer description is a factory order and must always reach the backend,
 * even when it mentions a keyword such as "Preis" or "Kalkulation".
 */
export const LOCAL_INTENT_MAX_CHARS = 40;

/** Maps a short intent command to an intent kind using the reference keywords; null for orders or no match. */
export function routeIntent(text: string): IntentKind | null {
  if (text.trim().length > LOCAL_INTENT_MAX_CHARS) return null;
  const normalized = text.toLowerCase();
  return ROUTING_ORDER.find((kind) => INTENT_KEYWORDS[kind].some((keyword) => normalized.includes(keyword))) ?? null;
}

/** Everything the intent node and module stage need; props-compatible with IntentNode and ModuleStage. */
export interface IntentRouter {
  readonly posture: IntentNodePosture;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  /** Routes and submits the text; returns the recognised kind or null (input is kept when nothing matches). */
  readonly onSubmit: (value: string) => IntentKind | null;
  /** Changes whenever the intent input should be focused (e.g. after "Review Draft"). */
  readonly focusRequest: number;
  readonly moduleState: ModuleState;
  readonly activeModule: ActiveModule | null;
  /** Estimate for the active calculator module, otherwise null. */
  readonly costEstimate: CostEstimate | null;
  readonly closeModule: () => void;
  /** "Commit to Project": closes the module and writes "Syncing to Project..." into the input. */
  readonly commitEstimate: () => void;
  /** Pass to ModuleStage `onExitComplete`; returns the intent node once the exit animation ended. */
  readonly onModuleExitComplete: () => void;
}

export function useIntentRouter(): IntentRouter {
  const posture = useIntentNodePosture();
  const value = useIntentText();
  const moduleState = useModuleState();
  const focusRequest = useIntentFocusRequest();
  const activeModule = useActiveModule();
  const { setIntentText, submitIntent, closeModule: closeModuleInStore, commitActiveModule } = useIntentActions();
  const { settleIntentNode } = useUiActions();
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSettleTimer = useCallback(() => {
    if (settleTimer.current !== null) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  useEffect(() => clearSettleTimer, [clearSettleTimer]);

  const onSubmit = useCallback(
    (text: string): IntentKind | null => {
      const kind = routeIntent(text);
      if (kind !== null) {
        clearSettleTimer();
        playUiSound('uiClick');
      }
      submitIntent(text, kind);
      return kind;
    },
    [clearSettleTimer, submitIntent],
  );

  const scheduleSettle = useCallback(() => {
    clearSettleTimer();
    const delay = prefersReducedMotion() ? 0 : INTENT_TIMING.moduleExitMs;
    settleTimer.current = setTimeout(() => {
      settleTimer.current = null;
      settleIntentNode();
    }, delay);
  }, [clearSettleTimer, settleIntentNode]);

  const closeModule = useCallback(() => {
    playUiSound('uiClick');
    closeModuleInStore();
    scheduleSettle();
  }, [closeModuleInStore, scheduleSettle]);

  const commitEstimate = useCallback(() => {
    playUiSound('uiClick');
    commitActiveModule();
    scheduleSettle();
  }, [commitActiveModule, scheduleSettle]);

  const onModuleExitComplete = useCallback(() => {
    clearSettleTimer();
    settleIntentNode();
  }, [clearSettleTimer, settleIntentNode]);

  const costEstimate = useMemo(() => (activeModule === null ? null : getCostEstimate(activeModule)), [activeModule]);

  return {
    posture,
    value,
    onValueChange: setIntentText,
    onSubmit,
    focusRequest,
    moduleState,
    activeModule,
    costEstimate,
    closeModule,
    commitEstimate,
    onModuleExitComplete,
  };
}
