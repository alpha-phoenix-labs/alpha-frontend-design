import type { StateCreator } from 'zustand';
import type { ActiveModule, IntentKind, IsoTimestamp, ModuleState } from '@/types/index.ts';
import type { CraftflowState } from '@/store/craftflowState.ts';

/** Record of the most recent intent submission, recognised or not. */
export interface IntentSubmission {
  readonly text: string;
  readonly kind: IntentKind | null;
  readonly submittedAt: IsoTimestamp;
}

/** Texts the reference writes into the intent input after actions. */
export const INTENT_STATUS_TEXT = {
  /** After "Commit to Project" on the cost estimate. */
  committing: 'Syncing to Project...',
  /** After "Review Draft" on an ambient notification. */
  reviewing: 'Reviewing Draft...',
} as const;

/** Intent input, last submission and the single module stage. */
export interface IntentSlice {
  readonly intentText: string;
  readonly lastSubmission: IntentSubmission | null;
  readonly moduleState: ModuleState;
  /** Incremented whenever the intent input should receive focus; the UI focuses on change. */
  readonly focusRequest: number;
  readonly setIntentText: (text: string) => void;
  /**
   * Records a submission. With a recognised kind the current module is replaced,
   * the input is cleared and the intent node recedes; returns the opened module or null.
   */
  readonly submitIntent: (text: string, kind: IntentKind | null) => ActiveModule | null;
  /** Opens a module directly, replacing any active one, and recedes the intent node. */
  readonly openModule: (kind: IntentKind, intentText: string) => ActiveModule;
  /** Removes the active module. The intent node stays receded until `settleIntentNode`. */
  readonly closeModule: () => void;
  /** "Commit to Project": removes the active module and writes the syncing text into the input. */
  readonly commitActiveModule: () => void;
  readonly requestIntentFocus: () => void;
}

let moduleSequence = 0;

function nextModuleId(): string {
  moduleSequence += 1;
  return `module-${Date.now().toString(36)}-${moduleSequence}`;
}

export const createIntentSlice: StateCreator<CraftflowState, [], [], IntentSlice> = (set, get) => ({
  intentText: '',
  lastSubmission: null,
  moduleState: { status: 'idle' },
  focusRequest: 0,
  setIntentText: (text) => set({ intentText: text }),
  submitIntent: (text, kind) => {
    const submittedAt = new Date().toISOString();
    set({ lastSubmission: { text, kind, submittedAt } });
    if (kind === null) {
      return null;
    }
    const opened = get().openModule(kind, text);
    set({ intentText: '' });
    return opened;
  },
  openModule: (kind, intentText) => {
    const module: ActiveModule = {
      id: nextModuleId(),
      kind,
      intentText,
      openedAt: new Date().toISOString(),
    };
    set({ moduleState: { status: 'active', module }, intentNodePosture: 'receded' });
    return module;
  },
  closeModule: () => set({ moduleState: { status: 'idle' } }),
  commitActiveModule: () => set({ moduleState: { status: 'idle' }, intentText: INTENT_STATUS_TEXT.committing }),
  requestIntentFocus: () => set((state) => ({ focusRequest: state.focusRequest + 1 })),
});
