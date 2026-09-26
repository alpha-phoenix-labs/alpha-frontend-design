/** All factory job statuses, exactly as defined in the CRAFTFLOW UI plan (Factory-Integrationsregel). */
export const JOB_STATUSES = [
  'idle',
  'queued',
  'generating',
  'generated',
  'importing',
  'testing',
  'blocked',
  'awaiting_human',
  'approved',
  'completed',
  'failed',
] as const;

/** Central factory job status. Components must not introduce their own status terms. */
export type JobStatus = (typeof JOB_STATUSES)[number];

/** Type guard for {@link JobStatus}. */
export function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === 'string' && (JOB_STATUSES as readonly string[]).includes(value);
}
