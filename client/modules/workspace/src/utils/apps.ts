import { useParams, useLocation } from 'react-router-dom';
import { z } from 'zod';
import {
  TAppCategories,
  TAppParamsType,
  TTapisSystem,
  TTapisApp,
  TTapisSystemQueue,
  TTasAllocations,
  TJobKeyValuePair,
} from '@client/hooks';
import { TFormValues } from '../AppsWizard/AppsFormSchema';
import { UseFormSetValue } from 'react-hook-form';
import { getSystemName } from '../utils';

export const TARGET_PATH_FIELD_PREFIX = '_TargetPath_';
export const DEFAULT_JOB_MAX_MINUTES = 60 * 24 * 2;

export const getExecSystemFromId = (
  execSystems: TTapisSystem[] | undefined,
  execSystemId: string | undefined
): TTapisSystem | null => {
  if (!execSystems?.length || !execSystemId) return null;
  return execSystems.find((exec_sys) => exec_sys.id === execSystemId) || null;
};

export const getExecSystemsFromApp = (
  definition: TTapisApp | undefined,
  execSystems: TTapisSystem[] | undefined
): TTapisSystem[] => {
  if (!definition || !execSystems) return [];

  if (isAppUsingDynamicExecSystem(definition)) {
    if (
      definition.notes.dynamicExecSystems?.length === 1 &&
      definition.notes.dynamicExecSystems[0] === 'ALL'
    )
      return execSystems;

    return execSystems.filter((s) =>
      definition.notes.dynamicExecSystems?.includes(s.id)
    );
  }

  const execSystemId = definition.jobAttributes?.execSystemId;
  if (!execSystemId) return [];

  const sys = execSystems.find(
    (s) => s.id === definition.jobAttributes.execSystemId
  );
  return sys ? [sys] : [];
};

export const getDefaultExecSystem = (
  definition: TTapisApp | undefined,
  execSystems: TTapisSystem[] | undefined
): TTapisSystem | null => {
  if (!definition || !execSystems || execSystems.length === 0) return null;

  const execSystemId = definition.jobAttributes?.execSystemId;

  if (!isAppUsingDynamicExecSystem(definition)) {
    return getExecSystemFromId(execSystems, execSystemId);
  }

  return (
    getExecSystemFromId(execSystems, execSystemId) ||
    getExecSystemFromId(execSystems, execSystems[0].id)
  );
};

export const getQueueMaxMinutes = (
  definition: TTapisApp,
  exec_sys: TTapisSystem,
  queueName: string
) => {
  if (!isAppTypeBATCH(definition)) {
    return DEFAULT_JOB_MAX_MINUTES;
  }

  return (
    exec_sys?.batchLogicalQueues.find((q) => q.name === queueName)
      ?.maxMinutes ?? 0
  );
};

export const preprocessStringToNumber = (value: unknown): unknown => {
  if (typeof value === 'string' && !isNaN(Number(value))) {
    return Number(value);
  }
  return value;
};

export const getExecSystemIdValidation = (
  definition: TTapisApp,
  executionSystems: TTapisSystem[]
) => {
  return definition.jobType === 'BATCH' && !!definition.notes.dynamicExecSystems
    ? z
        .string()
        .refine((value) => executionSystems?.some((e) => e.id === value), {
          message: 'A system is required to run this application.',
        })
    : z.string().optional();
};

export const getMaxMinutesValidation = (
  definition: TTapisApp,
  queue: TTapisSystemQueue
) => {
  if (!isAppTypeBATCH(definition)) {
    return z.preprocess(
      preprocessStringToNumber,
      z.number().lte(DEFAULT_JOB_MAX_MINUTES)
    );
  }
  if (!queue) {
    return z.preprocess(preprocessStringToNumber, z.number());
  }

  return z.preprocess(
    preprocessStringToNumber,
    z
      .number()
      .gte(
        queue.minMinutes,
        `Max Minutes must be greater than or equal to ${queue.minMinutes} for the ${queue.name} queue`
      )
      .lte(
        queue.maxMinutes,
        `Max Minutes must be less than or equal to ${queue.maxMinutes} for the ${queue.name} queue`
      )
  );
};

export const getNodeCountValidation = (
  definition: TTapisApp,
  queue: TTapisSystemQueue
) => {
  if (!isAppTypeBATCH(definition) || !queue) {
    return z.number().positive().optional();
  }
  return z.preprocess(
    preprocessStringToNumber,
    z
      .number()
      .int('Node Count must be an integer.')
      .gte(
        queue.minNodeCount,
        `Node Count must be greater than or equal to ${queue.minNodeCount} for the ${queue.name} queue.`
      )
      .lte(
        queue.maxNodeCount,
        `Node Count must be less than or equal to ${queue.maxNodeCount} for the ${queue.name} queue.`
      )
  );
};

export const getCoresPerNodeValidation = (
  definition: TTapisApp,
  queue: TTapisSystemQueue
) => {
  if (!isAppTypeBATCH(definition) || !queue || queue.maxCoresPerNode === -1) {
    return z.preprocess(
      preprocessStringToNumber,
      z.number().int().positive().optional()
    );
  }
  return z.preprocess(
    preprocessStringToNumber,
    z.number().int().gte(queue.minCoresPerNode).lte(queue.maxCoresPerNode)
  );
};

export const updateValuesForQueue = (
  execSystems: TTapisSystem[],
  execSystemId: string,
  values: TFormValues,
  setValue: UseFormSetValue<TFormValues>
) => {
  const exec_sys = getExecSystemFromId(execSystems, execSystemId);
  if (!exec_sys) {
    return;
  }

  const queue = getQueueValueForExecSystem({
    exec_sys,
    queue_name: values.configuration.execSystemLogicalQueue as string,
  });
  if (!queue) return;

  if ((values.configuration.nodeCount as number) < queue.minNodeCount) {
    setValue('configuration.nodeCount', queue.minNodeCount);
  }
  if ((values.configuration.nodeCount as number) > queue.maxNodeCount) {
    setValue('configuration.nodeCount', queue.maxNodeCount);
  }

  if ((values.configuration.coresPerNode as number) < queue.minCoresPerNode) {
    setValue('configuration.coresPerNode', queue.minCoresPerNode);
  }
  if (
    queue.maxCoresPerNode !== -1 &&
    (values.configuration.coresPerNode as number) > queue.maxCoresPerNode
  ) {
    setValue('configuration.coresPerNode', queue.maxCoresPerNode);
  }

  if ((values.configuration.maxMinutes as number) < queue.minMinutes) {
    setValue('configuration.maxMinutes', queue.minMinutes);
  }
  if ((values.configuration.maxMinutes as number) > queue.maxMinutes) {
    setValue('configuration.maxMinutes', queue.maxMinutes);
  }
};

export const getSystemDisplayName = (systemId: string): string => {
  if (!systemId) return '';
  if (systemId.toLowerCase() === 'ls6') {
    return 'Lonestar6';
  }
  return systemId.charAt(0).toUpperCase() + systemId.slice(1);
};

export const getAppExecSystems = (
  executionSystems: TTapisSystem[]
): { value: string; label: string }[] => {
  return executionSystems
    .map((exec_system) => {
      const label =
        exec_system?.notes?.label ??
        getSystemName(
          getExecSystemFromId(executionSystems, exec_system.id)?.host ?? ''
        );

      return {
        value: exec_system.id,
        label,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const getQueueValueForExecSystem = ({
  definition,
  exec_sys,
  queue_name,
}: {
  definition?: TTapisApp;
  exec_sys?: TTapisSystem;
  queue_name?: string;
}) => {
  const queueName =
    queue_name ??
    definition?.jobAttributes?.execSystemLogicalQueue ??
    exec_sys?.batchDefaultLogicalQueue;
  return (
    exec_sys?.batchLogicalQueues.find((q) => q.name === queueName) ||
    exec_sys?.batchLogicalQueues[0]
  );
};

export const getAppQueueValues = (
  definition: TTapisApp,
  queues: TTapisSystemQueue[]
) => {
  return (queues ?? [])
    .filter(
      (q) =>
        !definition.notes.hideNodeCountAndCoresPerNode ||
        (definition.jobAttributes.nodeCount >= q.minNodeCount &&
          definition.jobAttributes.nodeCount <= q.maxNodeCount)
    )
    .map((q) => q.name)
    .filter(
      (queueName) =>
        !definition.notes.queueFilter ||
        definition.notes.queueFilter.includes(queueName)
    )
    .sort();
};

export const getTargetPathFieldName = (inputFieldName: string) => {
  return TARGET_PATH_FIELD_PREFIX + inputFieldName;
};

export const isTargetPathField = (inputFieldName: string) => {
  return inputFieldName && inputFieldName.startsWith(TARGET_PATH_FIELD_PREFIX);
};

export const getInputFieldFromTargetPathField = (
  targetPathFieldName: string
) => {
  return targetPathFieldName.replace(TARGET_PATH_FIELD_PREFIX, '');
};

export const isTargetPathEmpty = (targetPathFieldValue?: string) => {
  if (targetPathFieldValue === null || targetPathFieldValue === undefined) {
    return true;
  }

  targetPathFieldValue = targetPathFieldValue.trim();

  if (targetPathFieldValue === '') {
    return true;
  }

  return false;
};

export const checkAndSetDefaultTargetPath = (targetPathFieldValue?: string) => {
  if (isTargetPathEmpty(targetPathFieldValue)) {
    return '*';
  }

  return targetPathFieldValue;
};

export const isAppUsingDynamicExecSystem = (definition: TTapisApp) => {
  return !!definition.notes.dynamicExecSystems;
};

export const getAllocationValidation = (
  definition: TTapisApp,
  allocations: string[]
) => {
  if (!isAppTypeBATCH(definition)) {
    return z.string().optional();
  }
  return z.enum(allocations as [string, ...string[]], {
    errorMap: () => ({
      message: 'Please select an allocation from the dropdown.',
    }),
  });
};

export const isAppTypeBATCH = (definition: TTapisApp) => {
  return definition.jobType === 'BATCH';
};

export const getExecSystemLogicalQueueValidation = (
  definition: TTapisApp,
  exec_sys: TTapisSystem
) => {
  if (!isAppTypeBATCH(definition)) {
    return z.string().optional();
  }

  return z.enum(
    (exec_sys?.batchLogicalQueues.map((q) => q.name) ?? []) as [
      string,
      ...string[]
    ]
  );
};

export const getAllocationList = (
  definition: TTapisApp,
  execSystems: TTapisSystem[],
  allocations: TTasAllocations,
  allocationToExecSysMap: Map<string, string[]>
) => {
  if (isAppUsingDynamicExecSystem(definition)) {
    return [...allocationToExecSysMap.keys()].filter((alloc: string) => {
      const execSysList = allocationToExecSysMap.get(alloc);
      return execSysList !== undefined && execSysList.length > 0;
    });
  }

  const matchingExecutionHost = Object.keys(allocations.hosts).find(
    (host) =>
      execSystems.length > 0 &&
      (execSystems[0].host === host || execSystems[0].host.endsWith(`.${host}`))
  );

  return matchingExecutionHost ? allocations.hosts[matchingExecutionHost] : [];
};

export const useGetAppParams = () => {
  const { appId } = useParams() as TAppParamsType;
  const location = useLocation();
  const appVersion = new URLSearchParams(location.search).get('appVersion') as
    | string
    | undefined;
  const jobUUID = new URLSearchParams(location.search).get('jobUUID') as
    | string
    | undefined;

  return { appId, appVersion, jobUUID };
};

export const findAppById = (
  data: TAppCategories | undefined,
  appId: string
) => {
  if (!data) return null;
  for (const category of data.categories) {
    for (const app of category.apps) {
      if (app.app_id === appId) {
        return app;
      }
    }
  }
  return null;
};

export const getOnDemandEnvVariables = (
  definition: TTapisApp
): { key: string; value: string }[] => {
  const includeOnDemandVars: { key: string; value: string }[] = [];

  Object.entries(definition.jobAttributes.parameterSet).forEach(
    ([parameterSetKey, parameterSetValue]) => {
      if (!Array.isArray(parameterSetValue)) return;

      if (parameterSetKey === 'envVariables') {
        parameterSetValue.forEach((param) => {
          if (
            param.notes?.isHidden &&
            param.inputMode === 'INCLUDE_ON_DEMAND'
          ) {
            includeOnDemandVars.push({
              key: (<TJobKeyValuePair>param).key,
              value: (<TJobKeyValuePair>param).value,
            });
          }
        });
      }
    }
  );
  return includeOnDemandVars;
};

export const getAppRuntimeLabel = (
  definition: TTapisApp,
  titleCase: boolean = false
): string => {
  const label = definition.notes.isInteractive ? 'interactive session' : 'job';

  return titleCase
    ? label
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : label;
};

export const areArraysEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
};
