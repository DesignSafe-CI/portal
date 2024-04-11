import { z } from 'zod';

export const TARGET_PATH_FIELD_PREFIX = '_TargetPath_';

export const getQueueMaxMinutes = (app, queueName) => {
  return app.exec_sys.batchLogicalQueues.find((q) => q.name === queueName)
    .maxMinutes;
};

/**
 * Get validator for max minutes of a queue
 *
 * @function
 * @param {Object} queue
 * @returns {z.number()} min/max validation of max minutes
 */
export const getMaxMinutesValidation = (queue) => {
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

// TODOv3  Create ticket for us/Design to decide if we want to continue to present max run time as hh:mm:ss and translate to maxMinutes
// https://jira.tacc.utexas.edu/browse/WP-99
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
 * @param {Object} queue
 * @returns {z.number()} min/max validation of node count
 */
export const getNodeCountValidation = (queue) => {
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
 * @param {Object} queue
 * @returns {z.number()} min/max validation of coresPerNode
 */
export const getCoresPerNodeValidation = (queue) => {
  if (queue.maxCoresPerNode === -1) {
    return z.number().int();
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
 * @param {Object} values
 * @returns {Object} updated/fixed values
 */
export const updateValuesForQueue = (app, values) => {
  const updatedValues = { ...values };
  const queue = app.exec_sys.batchLogicalQueues.find(
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

  /* // TODOv3  HH:MM:SS form https://jira.tacc.utexas.edu/browse/WP-99

    const runtimeRegExp = new RegExp(
      createMaxRunTimeRegex(longestMaxRequestedTime)
    );
    if (
      runtimeRegExp.test(values.maxMinutes) &&
      values.maxMinutes > queue.maxMinutes
    ) {
      updatedValues.maxMinutes = queue.maxMinutes;
    }
     */

  return updatedValues;
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
