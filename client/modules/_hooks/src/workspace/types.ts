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
          notes: {
            isHidden?: boolean;
          };
        }
      ];
      containerArgs: [
        {
          arg: string;
          name: string;
          description?: string;
          inputMode: string;
          notes: {
            isHidden?: boolean;
          };
        }
      ];
      schedulerOptions: [
        {
          arg: string;
          name: string;
          description?: string;
          inputMode: string;
          notes: {
            isHidden?: boolean;
          };
        }
      ];
      envVariables: [
        {
          key: string;
          value: string;
          description?: string;
          inputMode: string;
          notes: {
            isHidden?: boolean;
          };
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
        notes: object;
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
