import type { UiSlice } from '@/store/slices/uiSlice.ts';
import type { IntentSlice } from '@/store/slices/intentSlice.ts';
import type { AmbientSlice } from '@/store/slices/ambientSlice.ts';
import type { MetricsSlice } from '@/store/slices/metricsSlice.ts';

/** Combined state of the bound Craftflow store. */
export type CraftflowState = UiSlice & IntentSlice & AmbientSlice & MetricsSlice;
