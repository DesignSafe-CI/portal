import { TJob } from '@client/hooks';
import { STATUS_TEXT_MAP } from '../constants';
import { getSystemName } from './systems';

export function getStatusText(status: string) {
  if (status in STATUS_TEXT_MAP) {
    return STATUS_TEXT_MAP[status];
  }
  return 'Unknown';
}

const TERMINAL_STATES = [`FINISHED`, `CANCELLED`, `FAILED`];

export function isTerminalState(status : string) {
  return TERMINAL_STATES.includes(status);
}

// determine if state of job has output
export function isOutputState(status : string) {
  return isTerminalState(status) && status !== 'CANCELLED';
}

export function getArchivePath(job : TJob) {
  return `${job.archiveSystemId}${
    job.archiveSystemDir.charAt(0) === '/' ? '' : '/'
  }${job.archiveSystemDir}`;
}

export function getExecutionPath(job : TJob) {
  return `${job.execSystemId}${
    job.execSystemExecDir.charAt(0) === '/' ? '' : '/'
  }${job.execSystemExecDir}`;
}

export function getExecSysOutputPath(job : TJob) {
  return `${job.execSystemId}${
    job.execSystemOutputDir.charAt(0) === '/' ? '' : '/'
  }${job.execSystemOutputDir}`;
}

export function getOutputPath(job : TJob) {
  if (!job.remoteOutcome || !isOutputState(job.status)) {
    return '';
  }

  if (job.remoteOutcome === 'FAILED_SKIP_ARCHIVE') {
    return getExecSysOutputPath(job);
  }

  return getArchivePath(job);
}
