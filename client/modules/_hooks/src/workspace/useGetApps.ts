import { useQuery } from '@tanstack/react-query';
import apiClient from '../apiClient';

export type TAppParamsType = {
  appId: string;
  appVersion?: string;
};

type TTapisApp = {
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
  runtimeOptions: [string];
  containerImage: string;
  jobType: string;
  maxJobs: number;
  maxJobsPerUser: number;
  strictFileInputs: boolean;
  jobAttributes: {
    description?: string;
    dynamicExecSystem: boolean;
    execSystemConstraints?: [string];
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
        notes: {};
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
  tags: [string];
  notes: {
    label?: string;
    helpUrl?: string;
    category?: string;
    isInteractive?: boolean;
    hideNodeCountAndCoresPerNode?: boolean;
  };
  uuid: string;
  deleted: boolean;
  created: string;
  updated: string;
};

type TTapisSystemQueue = {
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

type TTapisSystem = {
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
  authnCredential?: {};
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
  notes: {};
  importRefId?: string;
  uuid: string;
  allowChildren: boolean;
  parentId?: string;
  deleted: boolean;
  created: string;
  updated: string;
};

type TAppResponse = {
  definition: TTapisApp;
  exec_sys: TTapisSystem;
  license: {
    type: null | string;
    enabled?: boolean;
  };
  systemNeedsKeys?: boolean;
  pushKeysSystem?: TTapisSystem;
};

async function getApps(
  { signal }: { signal: AbortSignal },
  params: TAppParamsType
) {
  console.log(params);
  const res = await apiClient.get<{
    response: TAppResponse;
    status: number;
  }>(`/api/workspace/apps/`, {
    signal,
    params,
  });
  return res.data.response;
}

function useGetApps(queryParams: TAppParamsType) {
  return useQuery({
    queryKey: ['workspace', 'getApps', queryParams],
    queryFn: ({ signal }) => getApps({ signal }, queryParams),
  });
}

export default useGetApps;
