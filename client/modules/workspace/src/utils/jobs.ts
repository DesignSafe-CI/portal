import { STATUS_TEXT_MAP, TERMINAL_STATES } from '../constants';
import {
  TJobStatusNotification,
  TAppResponse,
  TTapisJob,
  TAppFileInput,
  TJobArgSpecs,
  TJobKeyValuePair,
} from '@client/hooks';

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

export function getJobInteractiveSessionInfo(
  job: TTapisJob,
  interactiveNotifications: TJobStatusNotification[]
) {
  const jobConcluded =
    isTerminalState(job.status) || job.status === 'ARCHIVING';
  if (jobConcluded || !isInteractiveJob(job)) return {};

  const notif = interactiveNotifications?.find(
    (n) => n.extra.uuid === job.uuid
  );

  return {
    interactiveSessionLink: notif?.action_link,
    message: notif?.message,
  };
}

/* Return allocation
   queue directive has form: '-A TACC-ACI'
   */
export function getAllocatonFromDirective(directive: string | undefined) {
  if (!directive) return directive;
  const parts = directive.split(' ');
  const allocationArgIndex = parts.findIndex((obj) => obj === '-A') + 1;
  if (allocationArgIndex !== 0 && allocationArgIndex < parts.length) {
    return parts[allocationArgIndex];
  }
  return null;
}

export type TJobDisplayInputOrParameter = {
  label: string;
  id?: string;
  value?: string;
};

export type TJobDisplayInfo = {
  appId: string;
  appVersion?: string;
  applicationName: string;
  systemName: string;
  inputs: TJobDisplayInputOrParameter[];
  appArgs: TJobDisplayInputOrParameter[];
  envVars: TJobDisplayInputOrParameter[];
  archiveOnAppError: boolean;
  archiveSystemDir: string;
  archiveSystemId: string;
  archiveTransactionId?: string;
  exec_system_id: string;
  workPath: string;
  allocation?: string;
  queue?: string;
  coresPerNode?: number;
  nodeCount?: number;
};

/**
 * Get display values from job, app, and execution system info.
 */
export function getJobDisplayInformation(
  job: TTapisJob,
  app: TAppResponse | undefined
): TJobDisplayInfo {
  const filterAppArgs = (objects: TJobArgSpecs) =>
    objects.filter((obj) => !obj.notes || !obj.notes.isHidden);

  const filterInputs = (objects: TAppFileInput[]) =>
    objects.filter(
      (obj) =>
        (!obj.notes || !obj.notes.isHidden) &&
        !(obj.name || obj.sourceUrl || '').startsWith('_')
    );

  const filterParameters = (objects: TJobKeyValuePair[]) =>
    objects.filter(
      (obj) => (!obj.notes || !obj.notes.isHidden) && !obj.key.startsWith('_')
    );

  const fileInputs = filterInputs(
    JSON.parse(job.fileInputs) as TAppFileInput[]
  );
  const parameterSet = JSON.parse(job.parameterSet);
  const parameters = filterAppArgs(parameterSet.appArgs) as TJobArgSpecs;

  const displayEnvVariables = filterParameters(parameterSet.envVariables);
  const envVariables = parameterSet.envVariables as TJobKeyValuePair[];
  const schedulerOptions = parameterSet.schedulerOptions as TJobArgSpecs;

  const display: TJobDisplayInfo = {
    appId: job.appId,
    applicationName: job.appId,
    appVersion: job.appVersion,
    systemName: job.execSystemId,
    inputs: fileInputs.map((input) => ({
      label: input.name || 'Unnamed Input',
      id: input.sourceUrl,
      value: input.sourceUrl,
    })),
    appArgs: parameters.map((parameter) => ({
      label: parameter.name,
      id: parameter.name,
      value: parameter.arg,
    })),
    envVars: displayEnvVariables.map((d) => ({
      label: d.notes?.label ?? d.key,
      id: d.key,
      value: d.value,
    })),
    archiveOnAppError: false,
    archiveSystemDir: '',
    archiveSystemId: '',
    exec_system_id: job.execSystemId,
    workPath: '',
  };

  if (app) {
    try {
      display.applicationName =
        app.definition.notes.label || display.applicationName;

      const workPath = envVariables.find(
        (env) => env.key === '_tapisJobWorkingDir'
      );
      display.workPath = workPath ? workPath.value : '';

      if (app.definition.jobType === 'BATCH') {
        const allocationParam = schedulerOptions.find(
          (opt) => opt.name === 'TACC Allocation'
        );
        if (allocationParam) {
          const allocation = getAllocatonFromDirective(allocationParam.arg);
          if (allocation) {
            display.allocation = allocation;
          }
        }
        display.queue = job.execSystemLogicalQueue;
      }

      if (!app.definition.notes.hideNodeCountAndCoresPerNode) {
        display.coresPerNode = job.coresPerNode;
        display.nodeCount = job.nodeCount;
      }
    } catch (ignore) {
      // Ignore if there is a problem using the app definition to improve display
    }
  }

  return display;
}
