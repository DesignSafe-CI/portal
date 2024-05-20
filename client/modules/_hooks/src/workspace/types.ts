type TParameterSetNotes = {
  isHidden?: boolean;
  fieldType?: string;
  validator?: {
    regex: string;
    message: string;
  };
  enum_values?: [{ [dynamic: string]: string }];
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
  notes: TParameterSetNotes;
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
    helpUrl?: string;
    category?: string;
    isInteractive?: boolean;
    hideNodeCountAndCoresPerNode?: boolean;
    icon?: string;
    dynamicExecSystems?: string[];
    queueFilter?: string[];
  };
  uuid: string;
  deleted: boolean;
  created: string;
  updated: string;
};

export type TTasAllocations = {
  hosts: {
    [hostname: string]: string[];
  }
}
