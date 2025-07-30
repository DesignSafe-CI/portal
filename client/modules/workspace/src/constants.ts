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

export const QUEUE_LIST: Record<string, Record<string, string>> = {
  stampede3: {
    skx: 'skx (CPU, recommended standard compute)',
    'skx-dev': 'skx-dev (CPU, 2 hour max, 1 job max, for testing)',
    icx: 'icx (CPU, standard compute)',
    spr: 'spr (CPU, high memory bandwidth)',
    nvdimm: 'nvdimm (CPU, large memory)',
    pvc: 'pvc (GPU, Intel no CUDA)',
  },
  frontera: {
    normal: 'normal (CPU, 3 or more nodes/job)',
    small: 'small (CPU, 1-2 nodes/job)',
    development: 'development (CPU, 2 hour max, 1 job max, for testing)',
    nvdimm: 'nvdimm (CPU, large memory)',
    rtx: 'rtx (GPU)',
    'rtx-dev':
      'rtx-dev (GPU, 2 hour max, 1-2 nodes/job, 1 job max, for testing)',
  },
  vista: {
    gg: 'gg (CPU)',
    gh: 'gh (GPU)',
    'gh-dev': 'gh (GPU, 2 hour max, 1-8 nodes/job, 1 job max, for testing)',
  },
};
