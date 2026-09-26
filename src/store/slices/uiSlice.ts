import type { StateCreator } from 'zustand';
import type { IntentNodePosture } from '@/types/index.ts';
import type { CraftflowState } from '@/store/craftflowState.ts';

/** Global UI preferences and the posture of the intent node. */
export interface UiSlice {
  readonly soundMuted: boolean;
  readonly intentNodePosture: IntentNodePosture;
  readonly setSoundMuted: (muted: boolean) => void;
  readonly toggleSoundMuted: () => void;
  /** Returns the intent node to `idle`, but only while no module is active. */
  readonly settleIntentNode: () => void;
}

export const createUiSlice: StateCreator<CraftflowState, [], [], UiSlice> = (set, get) => ({
  soundMuted: false,
  intentNodePosture: 'idle',
  setSoundMuted: (muted) => set({ soundMuted: muted }),
  toggleSoundMuted: () => set((state) => ({ soundMuted: !state.soundMuted })),
  settleIntentNode: () => {
    if (get().moduleState.status === 'idle') {
      set({ intentNodePosture: 'idle' });
    }
  },
});
