import { AnimatePresence, motion } from "framer-motion";
import { useId } from "react";
import type { AmbientActionKind, AmbientNotification, AmbientSource } from "@/types/index.ts";
import { ChatIcon, MailIcon, WaveformIcon, WebhookIcon } from "@/components/ui/icons.tsx";
import { ambientCardMotion } from "@/components/ui/motion.ts";

export interface AmbientNotificationCardProps {
  notification: AmbientNotification | null;
  onAction: (kind: AmbientActionKind, notificationId: string) => void;
}

const sourceIcons: Record<AmbientSource, typeof WaveformIcon> = {
  voiceMemo: WaveformIcon,
  email: MailIcon,
  webhook: WebhookIcon,
  whatsapp: ChatIcon,
};

const timeFormat = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" });

function formatCreatedAt(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : timeFormat.format(date);
}

export function AmbientNotificationCard({ notification, onAction }: AmbientNotificationCardProps) {
  const titleId = useId();

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-end sm:inset-x-auto sm:right-12 sm:bottom-12" role="status" aria-live="polite">
      <AnimatePresence>
        {notification && (
          <motion.section
            key={notification.id}
            aria-labelledby={titleId}
            className="glass-panel pointer-events-auto w-full rounded-3xl border border-white/10 p-6 sm:w-96"
            variants={ambientCardMotion}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <AmbientCardBody notification={notification} titleId={titleId} onAction={onAction} />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function AmbientCardBody({
  notification,
  titleId,
  onAction,
}: {
  notification: AmbientNotification;
  titleId: string;
  onAction: AmbientNotificationCardProps["onAction"];
}) {
  const SourceIcon = sourceIcons[notification.source];

  return (
    <div className="flex items-start gap-5">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-linear-to-br from-emerald-400/20 to-emerald-600/5">
        <SourceIcon className="size-5 text-emerald-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 id={titleId} className="text-sm font-medium text-white">
            {notification.title}
          </h3>
          <time dateTime={notification.createdAt} className="shrink-0 font-mono text-[9px] text-spatial-dim uppercase">
            {formatCreatedAt(notification.createdAt)}
          </time>
        </div>
        <p className="mb-4 text-xs leading-relaxed font-light text-spatial-dim">{notification.message}</p>
        {notification.actions.length > 0 && (
          <div className="flex gap-3">
            {notification.actions.map((action) => (
              <button
                key={action.kind}
                type="button"
                onClick={() => onAction(action.kind, notification.id)}
                className={
                  action.kind === "review"
                    ? "flex-1 rounded-xl bg-white py-2.5 text-xs font-medium text-black shadow-md shadow-white/10 transition-all hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
                    : "flex-1 rounded-xl border border-white/5 bg-white/5 py-2.5 text-xs text-white/70 transition-all hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
                }
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
