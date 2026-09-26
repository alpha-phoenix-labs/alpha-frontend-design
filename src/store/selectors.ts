import { useShallow } from 'zustand/react/shallow';
import type {
  ActiveModule,
  AmbientNotification,
  IntentKind,
  IntentNodePosture,
  ModuleState,
  SystemMetrics,
} from '@/types/index.ts';
import type { CraftflowState } from '@/store/craftflowState.ts';
import type { IntentSubmission } from '@/store/slices/intentSlice.ts';
import { useCraftflowStore } from '@/store/craftflowStore.ts';

export const selectSoundMuted = (state: CraftflowState): boolean => state.soundMuted;
export const selectIntentNodePosture = (state: CraftflowState): IntentNodePosture => state.intentNodePosture;
export const selectIntentText = (state: CraftflowState): string => state.intentText;
export const selectLastSubmission = (state: CraftflowState): IntentSubmission | null => state.lastSubmission;
export const selectModuleState = (state: CraftflowState): ModuleState => state.moduleState;
export const selectActiveModule = (state: CraftflowState): ActiveModule | null =>
  state.moduleState.status === 'active' ? state.moduleState.module : null;
export const selectActiveModuleKind = (state: CraftflowState): IntentKind | null =>
  state.moduleState.status === 'active' ? state.moduleState.module.kind : null;
export const selectIsModuleActive = (state: CraftflowState): boolean => state.moduleState.status === 'active';
export const selectNotifications = (state: CraftflowState): readonly AmbientNotification[] => state.notifications;
export const selectActiveNotification = (state: CraftflowState): AmbientNotification | null =>
  state.notifications[0] ?? null;
export const selectMetrics = (state: CraftflowState): SystemMetrics => state.metrics;
export const selectLatencyMs = (state: CraftflowState): number => state.metrics.latencyMs;
export const selectVramUsedGb = (state: CraftflowState): number => state.metrics.vramUsedGb;

export const useSoundMuted = (): boolean => useCraftflowStore(selectSoundMuted);
export const useIntentNodePosture = (): IntentNodePosture => useCraftflowStore(selectIntentNodePosture);
export const useIntentText = (): string => useCraftflowStore(selectIntentText);
export const useLastSubmission = (): IntentSubmission | null => useCraftflowStore(selectLastSubmission);
export const useModuleState = (): ModuleState => useCraftflowStore(selectModuleState);
export const useActiveModule = (): ActiveModule | null => useCraftflowStore(selectActiveModule);
export const useActiveModuleKind = (): IntentKind | null => useCraftflowStore(selectActiveModuleKind);
export const useIsModuleActive = (): boolean => useCraftflowStore(selectIsModuleActive);
export const useNotifications = (): readonly AmbientNotification[] => useCraftflowStore(selectNotifications);
export const useActiveNotification = (): AmbientNotification | null => useCraftflowStore(selectActiveNotification);
export const useSystemMetricsSnapshot = (): SystemMetrics => useCraftflowStore(selectMetrics);

/** Header values only; re-renders when latency or VRAM change. */
export const useHeaderMetrics = (): Pick<SystemMetrics, 'latencyMs' | 'vramUsedGb'> =>
  useCraftflowStore(
    useShallow((state) => ({ latencyMs: state.metrics.latencyMs, vramUsedGb: state.metrics.vramUsedGb })),
  );

export type UiActions = Pick<CraftflowState, 'setSoundMuted' | 'toggleSoundMuted' | 'settleIntentNode'>;
export type IntentActions = Pick<CraftflowState, 'setIntentText' | 'submitIntent' | 'openModule' | 'closeModule'>;
export type AmbientActions = Pick<CraftflowState, 'pushNotification' | 'dismissNotification' | 'clearNotifications'>;
export type MetricsActions = Pick<CraftflowState, 'recordMetricsSample'>;

export const useUiActions = (): UiActions =>
  useCraftflowStore(
    useShallow((state) => ({
      setSoundMuted: state.setSoundMuted,
      toggleSoundMuted: state.toggleSoundMuted,
      settleIntentNode: state.settleIntentNode,
    })),
  );

export const useIntentActions = (): IntentActions =>
  useCraftflowStore(
    useShallow((state) => ({
      setIntentText: state.setIntentText,
      submitIntent: state.submitIntent,
      openModule: state.openModule,
      closeModule: state.closeModule,
    })),
  );

export const useAmbientActions = (): AmbientActions =>
  useCraftflowStore(
    useShallow((state) => ({
      pushNotification: state.pushNotification,
      dismissNotification: state.dismissNotification,
      clearNotifications: state.clearNotifications,
    })),
  );

export const useMetricsActions = (): MetricsActions =>
  useCraftflowStore(useShallow((state) => ({ recordMetricsSample: state.recordMetricsSample })));
