export type TParameterSetNotes = {
  isHidden?: boolean;
  fieldType?: string;
  validator?: {
    regex: string;
    message: string;
  };
  enum_values?: [{ [dynamic: string]: string }];
  label?: string;
};

export type TJobArgSpec = {
  name: string;
  arg?: string;
  description?: string;
  inputMode?: string;
  notes?: TParameterSetNotes;
};

export type TJobKeyValuePair = {
  key: string;
  value: string;
  description?: string;
  inputMode: string;
  notes?: TParameterSetNotes;
};

export type TJobArgSpecs = TJobArgSpec[];

export type TAppFileInput = {
  name: string;
  description?: string;
  inputMode?: string;
  envKey?: string;
  autoMountLocal?: boolean;
  notes?: {
    showTargetPath?: boolean;
    isHidden?: boolean;
    selectionMode?: string;
  };
  sourceUrl?: string;
  targetPath?: string;
};

export type TTapisApp = {
  sharedAppCtx: string;
  isPublic: boolean;
  sharedWithUsers: string[];
  tenant: string;
  id: string;
  version: string;
  description: string;
  owner: string;
  enabled: boolean;
  locked: boolean;
  runtime: string;
  runtimeVersion?: string;
  runtimeOptions: string[];
  containerImage: string;
  jobType: string;
  maxJobs: number;
  maxJobsPerUser: number;
  strictFileInputs: boolean;
  jobAttributes: {
    description?: string;
    dynamicExecSystem: boolean;
    execSystemConstraints?: string[];
    execSystemId: string;
    execSystemExecDir: string;
    execSystemInputDir: string;
    execSystemOutputDir: string;
    execSystemLogicalQueue: string;
    archiveSystemId: string;
    archiveSystemDir: string;
    archiveOnAppError: boolean;
    isMpi: boolean;
    mpiCmd: string;
    cmdPrefix?: string;
    parameterSet: {
      appArgs: TJobArgSpecs;
      containerArgs: TJobArgSpecs;
      schedulerOptions: TJobArgSpecs;
      envVariables: TJobKeyValuePair[];
      archiveFilter: {
        includes: string[];
        excludes: string[];
        includeLaunchFiles: boolean;
      };
      logConfig: {
        stdoutFilename: string;
        stderrFilename: string;
      };
    };
    fileInputs: TAppFileInput[];
    fileInputArrays: [];
    nodeCount: number;
    coresPerNode: number;
    memoryMB: number;
    maxMinutes: number;
    subscriptions: [];
    tags: string[];
  };
  tags: string[];
  notes: {
    label?: string;
    shortLabel?: string;
    helpUrl?: string;
    category?: string;
    isInteractive?: boolean;
    hideNodeCountAndCoresPerNode?: boolean;
    icon?: string;
    dynamicExecSystems?: string[];
    queueFilter?: string[];
    hideQueue?: boolean;
    hideAllocation?: boolean;
  };
  uuid: string;
  deleted: boolean;
  created: string;
  updated: string;
};

export type TTasAllocations = {
  hosts: {
    [hostname: string]: string[];
  };
};

export type TTapisJob = {
  appId: string;
  appVersion: string;
  archiveCorrelationId?: string;
  archiveOnAppError: boolean;
  archiveSystemDir: string;
  archiveSystemId: string;
  archiveTransactionId?: string;
  blockedCount: number;
  cmdPrefix?: string;
  condition: string;
  coresPerNode: number;
  created: string;
  createdby: string;
  createdbyTenant: string;
  description: string;
  dtnInputCorrelationId?: string;
  dtnInputTransactionId?: string;
  dtnOutputCorrelationId?: string;
  dtnOutputTransactionId?: string;
  dtnSystemId?: string;
  dtnSystemInputDir?: string;
  dtnSystemOutputDir?: string;
  dynamicExecSystem: boolean;
  ended: string;
  execSystemConstraints?: string;
  execSystemExecDir: string;
  execSystemId: string;
  execSystemInputDir: string;
  execSystemLogicalQueue: string;
  execSystemOutputDir: string;
  fileInputs: string;
  id: number;
  inputCorrelationId: string;
  inputTransactionId: string;
  isMpi: boolean;
  jobType: string;
  lastMessage: string;
  lastUpdated: string;
  maxMinutes: number;
  memoryMB: number;
  mpiCmd?: string;
  name: string;
  nodeCount: number;
  notes: string;
  owner: string;
  parameterSet: string;
  remoteChecksFailed: number;
  remoteChecksSuccess: number;
  remoteEnded?: string;
  remoteJobId?: string;
  remoteJobId2?: string;
  remoteLastStatusCheck?: string;
  remoteOutcome?: string;
  remoteQueue?: string;
  remoteResultInfo?: string;
  remoteStarted?: string;
  remoteSubmitRetries: number;
  remoteSubmitted?: string;
  sharedAppCtx: string;
  sharedAppCtxAttribs: string[];
  stageAppCorrelationId?: string;
  stageAppTransactionId?: string;
  status: string;
  subscriptions: string;
  tags: string[];
  tapisQueue: string;
  tenant: string;
  uuid: string;
  visible: boolean;
  _fileInputsSpec?: string;
  _parameterSetModel?: string;
};
