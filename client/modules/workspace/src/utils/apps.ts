import { z } from 'zod';

export const TARGET_PATH_FIELD_PREFIX = '_TargetPath_';
export const DEFAULT_JOB_MAX_MINUTES = 60 * 24;

/**
 * Get the execution system object for a given id of the execution system.
 */
export const getExecSystemFromId = (app, execSystemId) => {
  if (app.execSystems?.length) {
    return app.execSystems.find((exec_sys) => exec_sys.id === execSystemId);
  }

  return null;
};

/**
 * Gets the exec system for the default set in the job attributes.
 * Otherwise, get the first entry.
 */
export const getDefaultExecSystem = (app, execSystems) => {
  // If dynamic exec system is not setup, use from job attributes.
  if (!app.definition.notes.dynamicExecSystems) {
    return getExecSystemFromId(app, app.definition.jobAttributes.execSystemId);
  }

  if (execSystems?.length) {
    const execSystemId = app.definition.jobAttributes.execSystemId;

    // Check if the app's default execSystemId is in provided list
    if (execSystems.includes(execSystemId)) {
      return getExecSystemFromId(app, execSystemId);
    }

    // If not found, return the first execSystem from the provided list
    return getExecSystemFromId(app, execSystems[0]);
  }

  return null;
};

export const getQueueMaxMinutes = (app, exec_sys, queueName) => {
  if (!isAppTypeBATCH(app)) {
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
 * @param {Object} app
 * @param {Object} queue
 * @returns {z.number()} min/max validation of max minutes
 */
export const getMaxMinutesValidation = (app, queue) => {
  if (!isAppTypeBATCH(app)) {
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
 * Create regex pattern for maxRunTime
 * @function
 * @param {String} maxRunTime - maxRunTime given in the format of hh:mm:ss, usually from the target queue's maxRequestedTime
 * Creates a multigrouped regex to accommodate several layers of timestamps.
 */
export const createMaxRunTimeRegex = (maxRunTime) => {
  const replaceAt = (str, i, replace) => {
    return str.slice(0, i) + replace + str.slice(i + 1);
  };

  const timeStr = maxRunTime.replace(/:/g, '');
  let tmp = '[0-0][0-0]:[0-0][0-0]:[0-0][0-0]$'; // procedurally populated max value regex
  const regBase = '[0-4][0-9]:[0-5][0-9]:[0-5][0-9]$'; // default max values
  let upperReg = tmp;
  let regStr = '^'; // procedurally generated regex string to be returned

  let index = 3;

  // iterate through each value in the maxRunTime to generate a regex group
  timeStr.split('').forEach((n, i, arr) => {
    // only need to generate regex for nonzero values
    if (n > 0) {
      if (arr.length - 1 !== i) {
        tmp = replaceAt(tmp, index, n - 1);
        if (regStr !== '^') {
          regStr += '|^';
        }
        regStr += tmp.slice(0, index + 1) + regBase.slice(index + 1);
      }

      tmp = replaceAt(tmp, index, n);
      upperReg = replaceAt(upperReg, index, n);
      if (arr.length - 1 === i || arr[i + 1] === 0) {
        if (regStr !== '^') {
          regStr += '|^';
        }
        regStr += tmp;
      }
    }

    index += i % 2 === 0 ? 5 : 6;
  });
  return `${regStr}|${upperReg}`;
};

/**
 * Get validator for a node count of a queue
 *
 * @function
 * @param {Object} app
 * @param {Object} queue
 * @returns {z.number()} min/max validation of node count
 */
export const getNodeCountValidation = (app, queue) => {
  if (!isAppTypeBATCH(app) || !queue) {
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
 * @param {Object} app
 * @param {Object} queue
 * @returns {z.number()} min/max validation of coresPerNode
 */
export const getCoresPerNodeValidation = (app, queue) => {
  if (!isAppTypeBATCH(app) || !queue || queue.maxCoresPerNode === -1) {
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
 * @param {Object} app
 * @param {Object} values
 * @returns {Object} updated/fixed values
 */
export const updateValuesForQueue = (app, values) => {
  const exec_sys = getExecSystemFromId(app, values.execSystemId);
  const updatedValues = { ...values };
  const queue = exec_sys.batchLogicalQueues.find(
    (q) => q.name === values.execSystemLogicalQueue
  );

  if (values.nodeCount < queue.minNodeCount) {
    updatedValues.nodeCount = queue.minNodeCount;
  }
  if (values.nodeCount > queue.maxNodeCount) {
    updatedValues.nodeCount = queue.maxNodeCount;
  }

  if (values.coresPerNode < queue.minCoresPerNode) {
    updatedValues.coresPerNode = queue.minCoresPerNode;
  }
  if (
    queue.maxCoresPerNode !== -1 /* e.g. Frontera rtx/rtx-dev queue */ &&
    values.coresPerNode > queue.maxCoresPerNode
  ) {
    updatedValues.coresPerNode = queue.maxCoresPerNode;
  }

  if (values.maxMinutes < queue.minMinutes) {
    updatedValues.maxMinutes = queue.minMinutes;
  }
  if (values.maxMinutes > queue.maxMinutes) {
    updatedValues.maxMinutes = queue.maxMinutes;
  }

  return updatedValues;
};

/**
 * Get the default queue for a execution system.
 * Queue Name determination order:
 *   1. Use given queue name.
 *   2. Otherwise, use the app default queue.
 *   3. Otherwise, use the execution system default queue.
 *
 * @function
 * @param {any} app App Shape defined in AppForm.jsx
 * @param {any} exec_sys execution system, shape defined in AppForm.jsx
 * @param {any} queue_name
 * @returns {String} queue_name nullable, queue name to lookup
 */
export const getQueueValueForExecSystem = (app, exec_sys, queue_name) => {
  const queueName =
    queue_name ??
    app.definition.jobAttributes.execSystemLogicalQueue ??
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
 * @param {any} app App Shape defined in AppForm.jsx
 * @param {any} queues
 * @returns list of queues in sorted order
 */
export const getAppQueueValues = (app, queues) => {
  return (
    (queues ?? [])
      /*
    Hide queues for which the app default nodeCount does not meet the minimum or maximum requirements
    while hideNodeCountAndCoresPerNode is true
    */
      .filter(
        (q) =>
          !app.definition.notes.hideNodeCountAndCoresPerNode ||
          (app.definition.jobAttributes.nodeCount >= q.minNodeCount &&
            app.definition.jobAttributes.nodeCount <= q.maxNodeCount)
      )
      .map((q) => q.name)
      // Hide queues when app includes a queueFilter and queue is not present in queueFilter
      .filter(
        (queueName) =>
          !app.definition.notes.queueFilter ||
          app.definition.notes.queueFilter.includes(queueName)
      )
      .sort()
  );
};

/**
 * Build a map of allocations applicable to each execution
 * system based on the host match.
 * Handle case where dynamic execution system is provided.
 * If there is no allocation for a given exec system, skip it.
 * @param {any} app App Shape defined in AppForm.jsx
 * @param {any} allocations
 * @returns a Map of allocations applicable to each execution system.
 */
export const matchExecSysWithAllocations = (app, allocations) => {
  return app.execSystems.reduce((map, exec_sys) => {
    const matchingExecutionHost = Object.keys(allocations.hosts).find(
      (host) => exec_sys.host === host || exec_sys.host.endsWith(`.${host}`)
    );

    if (matchingExecutionHost) {
      map.set(exec_sys.id, allocations.hosts[matchingExecutionHost]);
    }

    return map;
  }, new Map());
};

/**
 * Get the field name used for target path in AppForm
 *
 * @function
 * @param {String} inputFieldName
 * @returns {String} field Name prefixed with target path
 */
export const getTargetPathFieldName = (inputFieldName) => {
  return TARGET_PATH_FIELD_PREFIX + inputFieldName;
};

/**
 * Whether a field name is a system defined field for Target Path
 *
 * @function
 * @param {String} inputFieldName
 * @returns {String} field Name suffixed with target path
 */
export const isTargetPathField = (inputFieldName) => {
  return inputFieldName && inputFieldName.startsWith(TARGET_PATH_FIELD_PREFIX);
};

/**
 * From target path field name, derive the original input field name.
 *
 * @function
 * @param {String} targetPathFieldName
 * @returns {String} actual field name
 */
export const getInputFieldFromTargetPathField = (targetPathFieldName) => {
  return targetPathFieldName.replace(TARGET_PATH_FIELD_PREFIX, '');
};

/**
 * Check if targetPath is empty on input field
 *
 * @function
 * @param {String} targetPathFieldValue
 * @returns {boolean} if target path is empty
 */
export const isTargetPathEmpty = (targetPathFieldValue) => {
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
export const checkAndSetDefaultTargetPath = (targetPathFieldValue) => {
  if (isTargetPathEmpty(targetPathFieldValue)) {
    return '*';
  }

  return targetPathFieldValue;
};

/**
 * Gets the execution systems with portal's default allocation.
 * It will return empty list, if there is no allocation system matching portal's
 * default allocation.
 * @param {Map} execSystemAllocationsMap
 * @param {String} portalAllocation
 */
export const getExecSystemsForPortalAllocation = (
  execSystemAllocationsMap,
  portalAllocation
) => {
  // Look at each execution system and its corressponding allocations
  // Gather all execution system whose allocation is the default portal allocation.
  const execSystems = [];
  execSystemAllocationsMap.forEach((execAllocations, execSystem) => {
    if (execAllocations.includes(portalAllocation)) {
      execSystems.push(execSystem);
    }
  });
  // If user does not have any execution systems matching portalAllocation,
  // this list will be empty.
  return execSystems;
};

export const isAppUsingDynamicExecSystem = (app) => {
  return !!app.definition.notes.dynamicExecSystems;
};

export const getAllocationValidation = (app, allocations) => {
  if (!isAppTypeBATCH(app)) {
    return z.string().optional();
  }
  return z.enum(allocations, {
    errorMap: (issue, ctx) => ({
      message: 'Please select an allocation from the dropdown.',
    }),
  });
};

export const isAppTypeBATCH = (app) => {
  return app.definition.jobType === 'BATCH';
};

export const getExecSystemLogicalQueueValidation = (app, exec_sys) => {
  if (!isAppTypeBATCH(app)) {
    return z.string().optional();
  }

  return z.enum(exec_sys?.batchLogicalQueues.map((q) => q.name) ?? []);
};
