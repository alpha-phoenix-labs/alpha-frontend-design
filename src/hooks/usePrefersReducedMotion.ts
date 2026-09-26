import { useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const canMatchMedia = (): boolean => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

function subscribe(onChange: () => void): () => void {
  if (!canMatchMedia()) {
    return () => undefined;
  }
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** Current value of the user's reduced-motion preference, without subscribing. */
export function prefersReducedMotion(): boolean {
  return canMatchMedia() && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Tracks `prefers-reduced-motion: reduce`. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
