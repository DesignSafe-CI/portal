import { useParams, useLocation } from 'react-router-dom';
import { z } from 'zod';
import {
  TAppParamsType,
  TTapisSystem,
  TTapisApp,
  TAppResponse,
  TTapisSystemQueue,
} from '@client/hooks';
import { TFormValues } from '../AppsWizard/AppsFormSchema';
import { UseFormSetValue } from 'react-hook-form';

export const TARGET_PATH_FIELD_PREFIX = '_TargetPath_';
export const DEFAULT_JOB_MAX_MINUTES = 60 * 24;

/**
 * Get the execution system object for a given id of the execution system.
 */
export const getExecSystemFromId = (
  execSystems: TTapisSystem[],
  execSystemId: string
) => {
  if (execSystems?.length) {
    return execSystems.find((exec_sys) => exec_sys.id === execSystemId);
  }

  return null;
};

/**
 * Filters available execution systems if dynamicExecSystems is defined.
 * Otherwise, return all available systems.
 */
export const getExecSystemsFromApp = (
  definition: TTapisApp,
  execSystems: TTapisSystem[]
) => {
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

  const sys = execSystems.find(
    (s) => s.id === definition.jobAttributes.execSystemId
  );
  return sys ? [sys] : [];
};

/**
 * Gets the exec system for the default set in the job attributes.
 * Otherwise, get the first entry.
 */
export const getDefaultExecSystem = (
  app: TAppResponse,
  execSystems: TTapisSystem[]
) => {
  // If dynamic exec system is not setup, use from job attributes.
  if (!app.definition.notes.dynamicExecSystems) {
    return getExecSystemFromId(
      execSystems,
      app.definition.jobAttributes.execSystemId
    );
  }

  if (execSystems?.length) {
    const execSystemId = app.definition.jobAttributes.execSystemId;

    // Check if the app's default execSystemId is in provided list
    // If not found, return the first execSystem from the provided list
    return (
      getExecSystemFromId(execSystems, execSystemId) ||
      getExecSystemFromId(execSystems, execSystems[0].id)
    );
  }

  return null;
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

/**
 * Get validator for max minutes of a queue
 *
 * @function
 * @param {Object} definition App definition
 * @param {Object} queue
 * @returns {z.number()} min/max validation of max minutes
 */
export const getMaxMinutesValidation = (
  definition: TTapisApp,
  queue: TTapisSystemQueue
) => {
  if (!isAppTypeBATCH(definition)) {
    return z.number().lte(DEFAULT_JOB_MAX_MINUTES);
  }
  if (!queue) {
    return z.number();
  }

  return z
    .number()
    .gte(
      queue.minMinutes,
      `Max Minutes must be greater than or equal to ${queue.minMinutes} for the ${queue.name} queue`
    )
    .lte(
      queue.maxMinutes,
      `Max Minutes must be less than or equal to ${queue.maxMinutes} for the ${queue.name} queue`
    );
};

/**
 * Get validator for a node count of a queue
 *
 * @function
 * @param {Object} definition App definition
 * @param {Object} queue
 * @returns {z.number()} min/max validation of node count
 */
export const getNodeCountValidation = (
  definition: TTapisApp,
  queue: TTapisSystemQueue
) => {
  if (!isAppTypeBATCH(definition) || !queue) {
    return z.number().positive().optional();
  }
  return z
    .number()
    .int('Node Count must be an integer.')
    .gte(
      queue.minNodeCount,
      `Node Count must be greater than or equal to ${queue.minNodeCount} for the ${queue.name} queue.`
    )
    .lte(
      queue.maxNodeCount,
      `Node Count must be less than or equal to ${queue.maxNodeCount} for the ${queue.name} queue.`
    );
};

/**
 * Get validator for cores on each node
 *
 * @function
 * @param {Object} definition App definition
 * @param {Object} queue
 * @returns {z.number()} min/max validation of coresPerNode
 */
export const getCoresPerNodeValidation = (
  definition: TTapisApp,
  queue: TTapisSystemQueue
) => {
  if (!isAppTypeBATCH(definition) || !queue || queue.maxCoresPerNode === -1) {
    return z.number().int().positive().optional();
  }
  return z.number().int().gte(queue.minCoresPerNode).lte(queue.maxCoresPerNode);
};

/**
 * Get corrected values for a new queue
 *
 * Check values and if any do not work with the current queue, then fix those
 * values.
 *
 * @function
 * @param {Object} execSystems
 * @param {Object} values
 * @returns {Object} updated/fixed values
 */
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
    queue.maxCoresPerNode !== -1 /* e.g. Frontera rtx/rtx-dev queue */ &&
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

/**
 * Get the default queue for a execution system.
 * Queue Name determination order:
 *   1. Use given queue name.
 *   2. Otherwise, use the app default queue.
 *   3. Otherwise, use the execution system default queue.
 */
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
    definition?.jobAttributes.execSystemLogicalQueue ??
    exec_sys?.batchDefaultLogicalQueue;
  return (
    exec_sys?.batchLogicalQueues.find((q) => q.name === queueName) ||
    exec_sys?.batchLogicalQueues[0]
  );
};

/**
 * Apply the following two filters and get the list of queues applicable.
 * Filters:
 * 1. If Node and Core per Node is enabled, only allow
 *    queues which match min and max node count with job attributes
 * 2. if queue filter list is set, only allow queues in that list.
 * @function
 * @param {any} definition App definition
 * @param {any} queues
 * @returns list of queues in sorted order
 */
export const getAppQueueValues = (
  definition: TTapisApp,
  queues: TTapisSystemQueue[]
) => {
  return (
    (queues ?? [])
      /*
    Hide queues for which the app default nodeCount does not meet the minimum or maximum requirements
    while hideNodeCountAndCoresPerNode is true
    */
      .filter(
        (q) =>
          !definition.notes.hideNodeCountAndCoresPerNode ||
          (definition.jobAttributes.nodeCount >= q.minNodeCount &&
            definition.jobAttributes.nodeCount <= q.maxNodeCount)
      )
      .map((q) => q.name)
      // Hide queues when app includes a queueFilter and queue is not present in queueFilter
      .filter(
        (queueName) =>
          !definition.notes.queueFilter ||
          definition.notes.queueFilter.includes(queueName)
      )
      .sort()
  );
};

/**
 * Get the field name used for target path in AppForm
 *
 * @function
 * @param {String} inputFieldName
 * @returns {String} field Name prefixed with target path
 */
export const getTargetPathFieldName = (inputFieldName: string) => {
  return TARGET_PATH_FIELD_PREFIX + inputFieldName;
};

/**
 * Whether a field name is a system defined field for Target Path
 *
 * @function
 * @param {String} inputFieldName
 * @returns {String} field Name suffixed with target path
 */
export const isTargetPathField = (inputFieldName: string) => {
  return inputFieldName && inputFieldName.startsWith(TARGET_PATH_FIELD_PREFIX);
};

/**
 * From target path field name, derive the original input field name.
 *
 * @function
 * @param {String} targetPathFieldName
 * @returns {String} actual field name
 */
export const getInputFieldFromTargetPathField = (
  targetPathFieldName: string
) => {
  return targetPathFieldName.replace(TARGET_PATH_FIELD_PREFIX, '');
};

/**
 * Check if targetPath is empty on input field
 *
 * @function
 * @param {String} targetPathFieldValue
 * @returns {boolean} if target path is empty
 */
export const isTargetPathEmpty = (targetPathFieldValue?: string) => {
  if (targetPathFieldValue === null || targetPathFieldValue === undefined) {
    return true;
  }

  targetPathFieldValue = targetPathFieldValue.trim();

  if (targetPathFieldValue.trim() === '') {
    return true;
  }

  return false;
};

/**
 * Sets the default value if target path is not set.
 *
 * @function
 * @param {String} targetPathFieldValue
 * @returns {String} target path value
 */
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
    errorMap: (issue, ctx) => ({
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

export const useGetAppParams = () => {
  const { appId } = useParams() as TAppParamsType;
  const location = useLocation();
  const appVersion = new URLSearchParams(location.search).get('appVersion') as
    | string
    | undefined;

  return { appId, appVersion };
};
