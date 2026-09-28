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
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-40 flex justify-end sm:inset-x-auto sm:right-10 sm:bottom-10" role="status" aria-live="polite">
      <AnimatePresence mode="wait">
        {notification && (
          <motion.section
            key={notification.id}
            aria-labelledby={`${titleId}-${notification.id}`}
            className="glass-panel pointer-events-auto w-full rounded-3xl border border-white/80 p-6 sm:w-96"
            variants={ambientCardMotion}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <AmbientCardBody notification={notification} titleId={`${titleId}-${notification.id}`} onAction={onAction} />
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
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50">
        <SourceIcon className="size-5 text-emerald-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 id={titleId} className="text-sm font-semibold text-slate-900">{notification.title}</h3>
          <time dateTime={notification.createdAt} className="shrink-0 font-mono text-[9px] text-slate-400 uppercase">
            {formatCreatedAt(notification.createdAt)}
          </time>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-slate-500">{notification.message}</p>
        {notification.actions.length > 0 && (
          <div className="flex gap-3">
            {notification.actions.map((action) => (
              <button
                key={action.kind}
                type="button"
                onClick={() => onAction(action.kind, notification.id)}
                className={
                  action.kind === "review"
                    ? "flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(79,70,229,.18)] transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
                    : "flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100"
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
