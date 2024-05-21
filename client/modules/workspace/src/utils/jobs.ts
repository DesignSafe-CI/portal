import { STATUS_TEXT_MAP, TERMINAL_STATES } from '../constants';
import { TTapisJob } from '@client/hooks';
import { useGetNotifications } from '@client/hooks';

export function getStatusText(status: string) {
  if (status in STATUS_TEXT_MAP) {
    return STATUS_TEXT_MAP[status];
  }
  return 'Unknown';
}

export function isTerminalState(status: string) {
  return TERMINAL_STATES.includes(status);
}

/**
 * Determine if job has output
 *
 * @param   status
 * @returns boolean
 */
export function isOutputState(status: string) {
  return isTerminalState(status) && status !== 'CANCELLED';
}

export function getArchivePath(job: TTapisJob) {
  return `${job.archiveSystemId}${
    job.archiveSystemDir.charAt(0) === '/' ? '' : '/'
  }${job.archiveSystemDir}`;
}

export function getExecutionPath(job: TTapisJob) {
  return `${job.execSystemId}${
    job.execSystemExecDir.charAt(0) === '/' ? '' : '/'
  }${job.execSystemExecDir}`;
}

export function getExecSysOutputPath(job: TTapisJob) {
  return `${job.execSystemId}${
    job.execSystemOutputDir.charAt(0) === '/' ? '' : '/'
  }${job.execSystemOutputDir}`;
}

export function getOutputPath(job: TTapisJob) {
  if (!job.remoteOutcome || !isOutputState(job.status)) {
    return '';
  }

  if (job.remoteOutcome === 'FAILED_SKIP_ARCHIVE') {
    return getExecSysOutputPath(job);
  }

  return getArchivePath(job);
}

export function isInteractiveJob(job: TTapisJob) {
  return job.tags.includes('isInteractive');
}

export function getJobInteractiveSessionInfo(job: TTapisJob) {
  const jobConcluded =
    isTerminalState(job.status) || job.status === 'ARCHIVING';
  if (jobConcluded || !isInteractiveJob(job)) return {};

  const {
    data: { notifs: interactiveNotifications },
  } = useGetNotifications({ event_type: 'interactive_session_ready' });

  const notif = interactiveNotifications.find((n) => n.extra.uuid === job.uuid);

  return {
    interactiveSessionLink: notif?.action_link,
    message: notif?.message,
  };
}
