import { motion } from "framer-motion";
import type { KeyboardEvent, Ref } from "react";
import type { IntentNodePosture } from "@/types/index.ts";
import { MicrophoneIcon } from "@/components/ui/icons.tsx";
import { intentNodeMotion } from "@/components/ui/motion.ts";

export interface IntentNodeProps {
  posture: IntentNodePosture;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onVoiceInput?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

export function IntentNode({
  posture,
  value,
  onValueChange,
  onSubmit,
  onVoiceInput,
  placeholder = "What's your intent? (Try 'kosten' or '3d')",
  autoFocus = true,
  inputRef,
}: IntentNodeProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      onSubmit(value);
    }
  };

  return (
    <motion.div
      className="pointer-events-auto absolute z-50 w-full max-w-xl"
      variants={intentNodeMotion}
      initial={false}
      animate={posture}
    >
      <div className="glass-pill flex items-center gap-3 rounded-full p-2 pr-3 pl-5 sm:gap-5 sm:pl-6">
        <div className="intent-orb" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Intent eingeben"
          autoComplete="off"
          autoFocus={autoFocus}
          enterKeyHint="go"
          className="min-w-0 flex-1 border-none bg-transparent py-3 text-base font-light text-white outline-none placeholder:font-light placeholder:text-white/20 sm:text-lg"
        />
        <button
          type="button"
          onClick={onVoiceInput}
          disabled={onVoiceInput === undefined}
          aria-label="Spracheingabe"
          className="group flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none disabled:cursor-default disabled:hover:bg-transparent"
        >
          <MicrophoneIcon className="size-4 text-spatial-dim transition-colors group-hover:text-white group-disabled:group-hover:text-spatial-dim" />
        </button>
      </div>
    </motion.div>
  );
}
