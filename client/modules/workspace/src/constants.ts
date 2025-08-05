export const STATUS_TEXT_MAP: Record<string, string> = {
  PENDING: 'Processing',
  PROCESSING_INPUTS: 'Processing',
  STAGING_INPUTS: 'Queueing',
  STAGING_JOB: 'Queueing',
  SUBMITTING_JOB: 'Queueing',
  QUEUED: 'Queueing',
  RUNNING: 'Running',
  ARCHIVING: 'Finishing',
  FINISHED: 'Finished',
  STOPPED: 'Stopped',
  FAILED: 'Failure',
  BLOCKED: 'Blocked',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
  ARCHIVED: 'Archived',
};

export const TERMINAL_STATES = [`FINISHED`, `CANCELLED`, `FAILED`];
