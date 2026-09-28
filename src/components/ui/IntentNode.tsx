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
      <div className="group flex h-10 items-center gap-3 rounded-xl border border-slate-900/[0.08] bg-white/70 px-3 shadow-glass-soft backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-cyan-500/30 focus-within:bg-white/88 focus-within:shadow-neon-cyan">
        <span
          className="text-[14px] text-cyan-600/55 transition group-focus-within:text-cyan-600"
          aria-hidden="true"
        >
          ⌕
        </span>
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
          className="min-w-0 flex-1 border-none bg-transparent text-[11px] text-slate-800 outline-none placeholder:text-slate-400"
        />
        <span className="rounded-md border border-slate-900/[0.08] bg-white/72 px-2 py-1 font-mono text-[8px] text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,.9)]">
          ⌘ K
        </span>
      </div>
    </motion.div>
  );
}
