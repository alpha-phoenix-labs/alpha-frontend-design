export {
  useIntentRouter,
  routeIntent,
  INTENT_KEYWORDS,
  INTENT_TIMING,
  INTENT_STATUS_TEXT,
  type IntentRouter,
} from '@/hooks/useIntentRouter.ts';
export {
  useAmbientSimulation,
  AMBIENT_SIMULATION_DELAY_MS,
  AMBIENT_VOICE_MEMO_NOTIFICATION,
  type AmbientSimulation,
  type AmbientSimulationOptions,
} from '@/hooks/useAmbientSimulation.ts';
export {
  useSystemMetrics,
  useMetricsSampling,
  simulateMetricsSample,
  SYSTEM_METRICS_INTERVAL_MS,
  VRAM_RANGE_GB,
  REFERENCE_LATENCY_MS,
  type SystemMetricsOptions,
} from '@/hooks/useSystemMetrics.ts';
export { useUiSound, playUiSound, SOUND_FILES, UI_SOUND_VOLUME, type SoundName, type UiSound } from '@/hooks/useUiSound.ts';
export { useIntentInputFocus } from '@/hooks/useIntentInputFocus.ts';
export { usePrefersReducedMotion, prefersReducedMotion } from '@/hooks/usePrefersReducedMotion.ts';
export { useFactoryJobPolling, FACTORY_POLL_INTERVAL_MS } from '@/hooks/useFactoryJobPolling.ts';

export { useSpectreFactoryIntegration } from '@/hooks/useSpectreFactoryIntegration.ts';
export type { SpectreFactoryIntegration, ApprovalGateSnapshot } from '@/hooks/useSpectreFactoryIntegration.ts';
