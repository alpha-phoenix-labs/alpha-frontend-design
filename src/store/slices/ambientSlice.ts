import type { StateCreator } from 'zustand';
import type { AmbientNotification } from '@/types/index.ts';
import type { CraftflowState } from '@/store/craftflowState.ts';
import { INTENT_STATUS_TEXT } from '@/store/slices/intentSlice.ts';

/** Queue of ambient notifications; the first entry is the visible card. */
export interface AmbientSlice {
  readonly notifications: readonly AmbientNotification[];
  /** Ids ever delivered in this session; prevents re-delivery after dismissal or remounts. */
  readonly deliveredNotificationIds: readonly string[];
  /** Enqueues a notification unless its id was already delivered; returns whether it was added. */
  readonly pushNotification: (notification: AmbientNotification) => boolean;
  readonly dismissNotification: (id: string) => void;
  /** "Review Draft": removes the notification, writes the reviewing text into the input and requests input focus. */
  readonly reviewNotification: (id: string) => void;
  readonly clearNotifications: () => void;
}

export const createAmbientSlice: StateCreator<CraftflowState, [], [], AmbientSlice> = (set, get) => ({
  notifications: [],
  deliveredNotificationIds: [],
  pushNotification: (notification) => {
    if (get().deliveredNotificationIds.includes(notification.id)) {
      return false;
    }
    set((state) => ({
      notifications: [...state.notifications, notification],
      deliveredNotificationIds: [...state.deliveredNotificationIds, notification.id],
    }));
    return true;
  },
  dismissNotification: (id) =>
    set((state) => ({ notifications: state.notifications.filter((entry) => entry.id !== id) })),
  reviewNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((entry) => entry.id !== id),
      intentText: INTENT_STATUS_TEXT.reviewing,
      focusRequest: state.focusRequest + 1,
    })),
  clearNotifications: () => set({ notifications: [] }),
});
