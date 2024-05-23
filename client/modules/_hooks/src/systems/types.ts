export type TTapisSystemQueue = {
  name: string;
  hpcQueueName: string;
  maxJobs: number;
  maxJobsPerUser: number;
  minNodeCount: number;
  maxNodeCount: number;
  minCoresPerNode: number;
  maxCoresPerNode: number;
  minMemoryMB: number;
  maxMemoryMB: number;
  minMinutes: number;
  maxMinutes: number;
};

export type TTapisSystem = {
  isPublic: boolean;
  isDynamicEffectiveUser: boolean;
  sharedWithUsers: [];
  tenant: string;
  id: string;
  description: string;
  systemType: string;
  owner: string;
  host: string;
  enabled: boolean;
  effectiveUserId: string;
  defaultAuthnMethod: string;
  authnCredential?: object;
  bucketName?: string;
  rootDir: string;
  port: number;
  useProxy: boolean;
  proxyHost?: string;
  proxyPort: number;
  dtnSystemId?: string;
  dtnMountPoint?: string;
  dtnMountSourcePath?: string;
  isDtn: boolean;
  canExec: boolean;
  canRunBatch: boolean;
  enableCmdPrefix: boolean;
  mpiCmd?: string;
  jobRuntimes: [
    {
      runtimeType: string;
      version?: string;
    }
  ];
  jobWorkingDir: string;
  jobEnvVariables: [];
  jobMaxJobs: number;
  jobMaxJobsPerUser: number;
  batchScheduler: string;
  batchLogicalQueues: TTapisSystemQueue[];
  batchDefaultLogicalQueue: string;
  batchSchedulerProfile: string;
  jobCapabilities: [];
  tags: [];
  notes: {
    label?: string;
    keyservice?: boolean;
    isMyData?: boolean;
  };
  importRefId?: string;
  uuid: string;
  allowChildren: boolean;
  parentId?: string;
  deleted: boolean;
  created: string;
  updated: string;
};
