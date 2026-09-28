import { motion } from "framer-motion";
import type { KeyboardEvent, Ref } from "react";
import type { IntentNodePosture } from "@/types/index.ts";
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
  placeholder = "What's your intent?",
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
      className="pointer-events-auto relative w-full max-w-[610px]"
      variants={intentNodeMotion}
      initial={false}
      animate={posture}
    >
      <div className="flex h-10 items-center gap-3 rounded-xl border border-[#1b3152] bg-[#071426] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,.025)] focus-within:border-indigo-500/45 focus-within:ring-2 focus-within:ring-indigo-500/10">
        <span className="text-[14px] text-slate-500" aria-hidden="true">⌕</span>
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
          className="min-w-0 flex-1 border-none bg-transparent text-[11px] text-slate-200 outline-none placeholder:text-slate-600"
        />
        <span className="rounded-md border border-[#20395e] bg-[#0a1a2f] px-2 py-1 font-mono text-[8px] text-slate-500">⌘ K</span>
      </div>
    </motion.div>
  );
}
