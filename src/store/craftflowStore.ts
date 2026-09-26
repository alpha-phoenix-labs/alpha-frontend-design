import { create } from 'zustand';
import type { CraftflowState } from '@/store/craftflowState.ts';
import { createUiSlice } from '@/store/slices/uiSlice.ts';
import { createIntentSlice } from '@/store/slices/intentSlice.ts';
import { createAmbientSlice } from '@/store/slices/ambientSlice.ts';
import { createMetricsSlice } from '@/store/slices/metricsSlice.ts';

/** Bound store combining the ui, intent, ambient and metrics slices. Use `getState`/`subscribe` outside React (e.g. in the render loop). */
export const useCraftflowStore = create<CraftflowState>()((...args) => ({
  ...createUiSlice(...args),
  ...createIntentSlice(...args),
  ...createAmbientSlice(...args),
  ...createMetricsSlice(...args),
}));
