type TParameterSetNotes = {
  isHidden?: boolean;
  fieldType?: string;
  validator?: {
    regex: string;
    message: string;
  };
  enum_values?: [{ [dynamic: string]: string }];
};

export type TTapisApp = {
  sharedAppCtx: string;
  isPublic: boolean;
  sharedWithUsers: [];
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
      appArgs: [
        {
          arg: string;
          name: string;
          description?: string;
          inputMode: string;
          notes: TParameterSetNotes;
        }
      ];
      containerArgs: [
        {
          arg: string;
          name: string;
          description?: string;
          inputMode: string;
          notes: TParameterSetNotes;
        }
      ];
      schedulerOptions: [
        {
          arg: string;
          name: string;
          description?: string;
          inputMode: string;
          notes: TParameterSetNotes;
        }
      ];
      envVariables: [
        {
          key: string;
          value: string;
          description?: string;
          inputMode: string;
          notes: TParameterSetNotes;
        }
      ];
      archiveFilter: {
        includes: [];
        excludes: [];
        includeLaunchFiles: boolean;
      };
      logConfig: {
        stdoutFilename: string;
        stderrFilename: string;
      };
    };
    fileInputs: [
      {
        name: string;
        description?: string;
        inputMode: string;
        autoMountLocal: boolean;
        notes: {
          showTargetPath?: boolean;
          isHidden?: boolean;
        };
        sourceUrl: string;
        targetPath: string;
      }
    ];
    fileInputArrays: [];
    nodeCount: number;
    coresPerNode: number;
    memoryMB: number;
    maxMinutes: number;
    subscriptions: [];
    tags: [];
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
