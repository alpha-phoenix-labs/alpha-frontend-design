import { useEffect, useRef, type RefObject } from 'react';
import { useIntentFocusRequest } from '@/store/index.ts';

/**
 * Ref for the intent input that is focused whenever the store requests it
 * (`focusRequest` changes, e.g. after "Review Draft"). Pass it as `inputRef` to IntentNode.
 */
export function useIntentInputFocus(): RefObject<HTMLInputElement | null> {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const focusRequest = useIntentFocusRequest();

  useEffect(() => {
    if (focusRequest > 0) {
      inputRef.current?.focus();
    }
  }, [focusRequest]);

  return inputRef;
}
