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
      className="pointer-events-auto absolute z-50 w-[calc(100%-2rem)] max-w-2xl"
      variants={intentNodeMotion}
      initial={false}
      animate={posture}
    >
      <div className="glass-pill flex items-center gap-3 rounded-[1.6rem] p-2.5 pr-3 pl-5 sm:gap-5 sm:pl-6">
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
          className="min-w-0 flex-1 border-none bg-transparent py-3.5 text-base font-normal text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 sm:text-lg"
        />
        <button
          type="button"
          onClick={onVoiceInput}
          disabled={onVoiceInput === undefined}
          aria-label="Spracheingabe"
          className="group flex size-10 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/80 transition hover:border-indigo-100 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 disabled:cursor-default disabled:opacity-60"
        >
          <MicrophoneIcon className="size-4 text-slate-400 transition-colors group-hover:text-indigo-600 group-disabled:group-hover:text-slate-400" />
        </button>
      </div>
      <div className="pointer-events-none mt-3 flex justify-center">
        <span className="rounded-full border border-white/80 bg-white/72 px-3 py-1.5 font-mono text-[9px] tracking-[0.12em] text-slate-400 uppercase shadow-sm backdrop-blur">
          Press Enter to build
        </span>
      </div>
    </motion.div>
  );
}
