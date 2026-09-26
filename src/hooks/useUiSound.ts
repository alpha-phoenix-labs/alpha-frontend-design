import { useMemo } from 'react';
import { useCraftflowStore, useSoundMuted, useUiActions } from '@/store/index.ts';

/** UI sounds from the reference: interaction click and ambient notification chime. */
export type SoundName = 'uiClick' | 'ambientChime';

/** File names below `public/sounds/`. */
export const SOUND_FILES = {
  uiClick: 'ui-click.mp3',
  ambientChime: 'ambient-chime.mp3',
} as const satisfies Readonly<Record<SoundName, string>>;

/** Playback volume from the reference (softer for spatial aesthetics). */
export const UI_SOUND_VOLUME = 0.1;

const audioCache = new Map<SoundName, HTMLAudioElement | null>();

function getAudio(name: SoundName): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') {
    return null;
  }
  const cached = audioCache.get(name);
  if (cached !== undefined) {
    return cached;
  }
  const audio = new Audio(`${import.meta.env.BASE_URL}sounds/${SOUND_FILES[name]}`);
  audio.preload = 'auto';
  audio.addEventListener('error', () => audioCache.set(name, null), { once: true });
  audioCache.set(name, audio);
  return audio;
}

/**
 * Plays a UI sound unless muted. Audio elements are created lazily; missing files
 * and blocked autoplay are ignored silently.
 */
export function playUiSound(name: SoundName): void {
  if (useCraftflowStore.getState().soundMuted) {
    return;
  }
  const audio = getAudio(name);
  if (audio === null) {
    return;
  }
  audio.volume = UI_SOUND_VOLUME;
  audio.currentTime = 0;
  audio.play().catch(() => undefined);
}

/** Sound playback plus the mute flag of the ui slice. */
export interface UiSound {
  readonly play: (name: SoundName) => void;
  readonly muted: boolean;
  readonly setMuted: (muted: boolean) => void;
  readonly toggleMuted: () => void;
}

export function useUiSound(): UiSound {
  const muted = useSoundMuted();
  const { setSoundMuted, toggleSoundMuted } = useUiActions();
  return useMemo(
    () => ({ play: playUiSound, muted, setMuted: setSoundMuted, toggleMuted: toggleSoundMuted }),
    [muted, setSoundMuted, toggleSoundMuted],
  );
}
