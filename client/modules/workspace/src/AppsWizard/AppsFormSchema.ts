import { z, ZodType, ZodObject, ZodRawShape } from 'zod';
import {
  TTapisApp,
  TJobKeyValuePair,
  TJobArgSpec,
  TConfigurationValues,
  TOutputValues,
  TTapisSystem,
  TTapisSystemQueue,
} from '@client/hooks';

import {
  checkAndSetDefaultTargetPath,
  getTargetPathFieldName,
  getNodeCountValidation,
  getCoresPerNodeValidation,
  getMaxMinutesValidation,
  getAllocationValidation,
  getExecSystemsFromApp,
  getExecSystemFromId,
  getAppQueueValues,
  getQueueValueForExecSystem,
  getQueueMaxMinutes,
  isAppTypeBATCH,
  getExecSystemLogicalQueueValidation,
  preprocessStringToNumber,
} from '../utils';

export type TDynamicString = { [dynamic: string]: string | number };
export type TDynamicField = { [dynamic: string]: TField };
export type TParameterSetDefaults = {
  [dynamic: string]: TDynamicString;
};
export type TFileInputsDefaults = TDynamicString;

export type TFieldOptions = {
  label: string;
  value?: string;
  hidden?: boolean;
  disabled?: boolean;
};

export type TFormValues = {
  inputs: TFileInputsDefaults;
  parameters: TParameterSetDefaults;
  configuration: TConfigurationValues;
  outputs: TOutputValues;
};

export type TField = {
  label: string;
  required: boolean;
  name: string;
  key: string;
  type: string;
  parameterSet?: string;
  description?: string;
  options?: TFieldOptions[];
  tapisFile?: boolean;
  tapisFileSelectionMode?: string;
  placeholder?: string;
  readOnly?: boolean;
};

export type TAppFieldSchema = {
  inputs: ZodObject<ZodRawShape>;
  parameters: ZodObject<ZodRawShape>;
  configuration: ZodObject<ZodRawShape>;
  outputs: ZodObject<ZodRawShape>;
};

export type TAppFormSchema = {
  fileInputs: {
    defaults: TFileInputsDefaults;
    fields: TDynamicField;
    schema: { [dynamic: string]: ZodType };
  };
  parameterSet: {
    defaults: TParameterSetDefaults;
    fields: {
      [dynamic: string]: TDynamicField;
    };
    schema: {
      [dynamic: string]: ZodType;
    };
  };
  configuration: {
    defaults: TConfigurationValues;
    fields: TDynamicField;
    schema: { [dynamic: string]: ZodType };
  };
  outputs: {
    defaults: TOutputValues;
    fields: TDynamicField;
    schema: { [dynamic: string]: ZodType };
  };
};

export const inputFileRegex = /^tapis:\/\/(?<storageSystem>[^/]+)/;

export const fieldDisplayOrder: Record<string, string[]> = {
  configuration: [
    'execSystemLogicalQueue',
    'maxMinutes',
    'nodeCount',
    'coresPerNode',
    'allocation',
  ],
  outputs: ['name', 'archiveSystemId', 'archiveSystemDir'],
};

// See https://github.com/colinhacks/zod/issues/310 for Zod issue
const emptyStringToUndefined = z.literal('').transform(() => undefined);
function asOptionalField<T extends z.ZodTypeAny>(schema: T) {
  return schema.optional().or(emptyStringToUndefined);
}

// Configuration Schema is pulled out of the default Schema
// building logic because configuration can change based on queue
// or exec system changes.
export const getConfigurationSchema = (
  definition: TTapisApp,
  allocations: string[],
  execSystem: TTapisSystem,
  queue: TTapisSystemQueue
) => {
  const configurationSchema: { [dynamic: string]: ZodType } = {};

  if (definition.jobType === 'BATCH') {
    configurationSchema['execSystemLogicalQueue'] =
      getExecSystemLogicalQueueValidation(definition, execSystem);
    configurationSchema['allocation'] = getAllocationValidation(
      definition,
      allocations
    );
  }

  configurationSchema['maxMinutes'] = getMaxMinutesValidation(
    definition,
    queue
  );
  if (!definition.notes.hideNodeCountAndCoresPerNode) {
    configurationSchema['nodeCount'] = getNodeCountValidation(
      definition,
      queue
    );

    configurationSchema['coresPerNode'] = getCoresPerNodeValidation(
      definition,
      queue
    );
  }
  return configurationSchema;
};

// Pulling configuration fields out of the main schema building
// to allow for rebuilding of fields based on values changes.
// Example: description has max minutes value, which is dependent
// on queue.
export const getConfigurationFields = (
  definition: TTapisApp,
  allocations: string[],
  executionSystems: TTapisSystem[],
  queue: TTapisSystemQueue
) => {
  const configurationFields: TDynamicField = {};

  const execSystems = getExecSystemsFromApp(
    definition,
    executionSystems as TTapisSystem[]
  );

  const defaultExecSystem = getExecSystemFromId(
    execSystems,
    definition.jobAttributes.execSystemId
  ) as TTapisSystem;

  if (definition.jobType === 'BATCH') {
    configurationFields['execSystemLogicalQueue'] = {
      description: 'Select the queue this job will execute on.',
      label: 'Queue',
      name: 'configuration.execSystemLogicalQueue',
      key: 'configuration.execSystemLogicalQueue',
      required: true,
      type: 'select',
      options: getAppQueueValues(
        definition,
        execSystems[0].batchLogicalQueues
      ).map((q) => ({ value: q, label: q })),
    };
    configurationFields['allocation'] = {
      description:
        'Select the project allocation you would like to use with this job submission.',
      label: 'Allocation',
      name: 'configuration.allocation',
      key: 'configuration.allocation',
      required: true,
      type: 'select',
      options: [
        { label: '', hidden: true, disabled: true },
        ...allocations.sort().map((projectId) => ({
          value: projectId,
          label: projectId,
        })),
      ],
    };
  }

  configurationFields['maxMinutes'] = {
    description: `The maximum number of minutes you expect this job to run for. Maximum possible is ${getQueueMaxMinutes(
      definition,
      defaultExecSystem,
      queue?.name
    )} minutes. After this amount of time your job will end. Shorter run times result in shorter queue wait times.`,
    label: 'Maximum Job Runtime (minutes)',
    name: 'configuration.maxMinutes',
    key: 'configuration.maxMinutes',
    required: true,
    type: 'number',
  };

  if (!definition.notes.hideNodeCountAndCoresPerNode) {
    configurationFields['nodeCount'] = {
      description: 'Number of requested process nodes for the job.',
      label: 'Node Count',
      name: 'configuration.nodeCount',
      key: 'configuration.nodeCount',
      required: true,
      type: 'number',
    };

    configurationFields['coresPerNode'] = {
      description:
        'Number of processors (cores) per node for the job. e.g. a selection of 16 processors per node along with 4 nodes will result in 16 processors on 4 nodes, with 64 processors total.',
      label: 'Cores Per Node',
      name: 'configuration.coresPerNode',
      key: 'configuration.coresPerNode',
      required: true,
      type: 'number',
    };
  }

  return configurationFields;
};

const FormSchema = (
  definition: TTapisApp,
  executionSystems: TTapisSystem[],
  allocations: string[],
  defaultStorageSystem: TTapisSystem,
  username: string,
  portalAlloc?: string
) => {
  const appFields: TAppFormSchema = {
    fileInputs: {
      defaults: {},
      fields: {},
      schema: {},
    },
    parameterSet: {
      defaults: {},
      fields: {},
      schema: {},
    },
    configuration: {
      defaults: {
        maxMinutes: 0,
      },
      fields: {},
      schema: {},
    },
    outputs: {
      defaults: {
        name: '',
        archiveSystemId: '',
        archiveSystemDir: '',
      },
      fields: {},
      schema: {},
    },
  };

  Object.entries(definition.jobAttributes.parameterSet).forEach(
    ([parameterSet, parameterSetValue]) => {
      if (!Array.isArray(parameterSetValue)) return;
      const parameterSetSchema: {
        [dynamic: string]: ZodType;
      } = {};
      const parameterSetFields: {
        [dynamic: string]: TField;
      } = {};
      const parameterSetDefaults: {
        [dynamic: string]: string;
      } = {};

      parameterSetValue.forEach((param) => {
        if (param.notes?.isHidden) {
          return;
        }
        const paramId =
          param.notes?.label ??
          (<TJobArgSpec>param).name ??
          (<TJobKeyValuePair>param).key;

        const field: TField = {
          label: paramId,
          description: param.description,
          required: param.inputMode === 'REQUIRED',
          readOnly: param.inputMode === 'FIXED',
          parameterSet: parameterSet,
          name: `parameters.${parameterSet}.${paramId}`,
          key: `parameters.${parameterSet}.${paramId}`,
          type: 'text',
        };

        if (param.notes?.enum_values) {
          field.type = 'select';
          field.options = param.notes?.enum_values.map(
            (item) =>
              Object.entries(item).map(([key, value]) => ({
                value: key,
                label: value,
              }))[0]
          );
          parameterSetSchema[field.label] = z.enum(
            field.options.map(({ value }) => value) as [string, ...string[]]
          );
        } else if (param.notes?.fieldType === 'email') {
          field.type = 'email';
          parameterSetSchema[field.label] = z
            .string()
            .email('Must be a valid email.');
        } else if (param.notes?.fieldType === 'number') {
          field.type = 'number';
          parameterSetSchema[field.label] = z.preprocess(
            preprocessStringToNumber,
            z.number()
          );
        } else {
          field.type = 'text';
          // Need to do this for non empty strings. Zod does not handle
          // string with 0 length even with required property.
          parameterSetSchema[field.label] = z
            .string()
            .refine((data) => data.trim() !== '');
        }

        if (!field.required) {
          parameterSetSchema[field.label] = asOptionalField(
            parameterSetSchema[field.label]
          );
        }
        if (param.notes?.validator?.regex && param.notes?.validator?.message) {
          try {
            const regex = RegExp(param.notes.validator.regex);
            parameterSetSchema[field.label] = (<z.ZodString>(
              parameterSetSchema[field.label]
            )).regex(regex, param.notes.validator.message);
          } catch (SyntaxError) {
            console.warn('Invalid regex pattern for app');
          }
        }
        parameterSetFields[field.label] = field;
        parameterSetDefaults[field.label] =
          (<TJobArgSpec>param).arg ?? (<TJobKeyValuePair>param).value ?? '';
      });

      // Only create schema for parameterSet if it contains values
      if (Object.keys(parameterSetSchema).length) {
        appFields.parameterSet.schema[parameterSet] =
          z.object(parameterSetSchema);
      }
      // Only create fields for parameterSet if it contains values
      if (Object.keys(parameterSetFields).length) {
        appFields.parameterSet.fields[parameterSet] = parameterSetFields;
      }
      // Only add defaults for parameterSet if it contains values
      if (Object.keys(parameterSetDefaults).length) {
        appFields.parameterSet.defaults[parameterSet] = parameterSetDefaults;
      }
    }
  );

  (definition.jobAttributes.fileInputs || []).forEach((input) => {
    if (input.notes?.isHidden) {
      return;
    }

    const field: TField = {
      label: input.name,
      description: input.description,
      required: input.inputMode === 'REQUIRED',
      name: `inputs.${input.name}`,
      key: `inputs.${input.name}`,
      tapisFile: true,
      type: 'text',
      placeholder: 'Browse Data Files',
      readOnly: input.inputMode === 'FIXED',
      tapisFileSelectionMode: input.notes?.selectionMode ?? 'both',
    };

    appFields.fileInputs.schema[input.name] = z.string();
    appFields.fileInputs.schema[input.name] = (<z.ZodString>(
      appFields.fileInputs.schema[input.name]
    )).regex(
      /^tapis:\/\//g,
      "Input file must be a valid Tapis URI, starting with 'tapis://'"
    );

    if (!field.required) {
      appFields.fileInputs.schema[input.name] = asOptionalField(
        appFields.fileInputs.schema[input.name]
      );
    }

    appFields.fileInputs.fields[input.name] = field;
    appFields.fileInputs.defaults[input.name] =
      input.sourceUrl === null || typeof input.sourceUrl === 'undefined'
        ? ''
        : input.sourceUrl;

    // The default is to not show target path for file inputs.
    const showTargetPathForFileInputs =
      (input.notes?.showTargetPath && input.targetPath) ?? false;
    // Add targetDir for all sourceUrl
    if (!showTargetPathForFileInputs) {
      return;
    }
    const targetPathName = getTargetPathFieldName(input.name);
    appFields.fileInputs.schema[targetPathName] = z.string();
    appFields.fileInputs.schema[targetPathName] = (<z.ZodString>(
      appFields.fileInputs.schema[targetPathName]
    )).regex(
      /^tapis:\/\//g,
      "Input file Target Directory must be a valid Tapis URI, starting with 'tapis://'"
    );

    appFields.fileInputs.schema[targetPathName] = z.string().optional();
    appFields.fileInputs.fields[targetPathName] = {
      label: 'Target Path for ' + input.name,
      description:
        'The name of the ' +
        input.name +
        ' after it is copied to the target system, but before the job is run. Leave this value blank to just use the name of the input file.',
      required: false,
      readOnly: field.readOnly,
      name: `inputs.${targetPathName}`,
      key: `inputs.${targetPathName}`,
      type: 'text',
      placeholder: 'Target Path Name',
    };
    appFields.fileInputs.defaults[targetPathName] =
      checkAndSetDefaultTargetPath(input.targetPath) as string;
  });

  // Configuration
  const execSystems = getExecSystemsFromApp(
    definition,
    executionSystems as TTapisSystem[]
  );

  const defaultExecSystem = getExecSystemFromId(
    execSystems,
    definition.jobAttributes.execSystemId
  ) as TTapisSystem;

  const queue = getQueueValueForExecSystem({
    definition,
    exec_sys: defaultExecSystem,
    queue_name: definition.jobAttributes.execSystemLogicalQueue,
  }) as TTapisSystemQueue;

  if (definition.jobType === 'BATCH') {
    appFields.configuration.defaults['execSystemLogicalQueue'] = isAppTypeBATCH(
      definition
    )
      ? definition.jobAttributes.execSystemLogicalQueue
      : '';

    appFields.configuration.defaults['allocation'] = isAppTypeBATCH(definition)
      ? allocations.includes(portalAlloc || '')
        ? portalAlloc
        : allocations.length === 1
        ? allocations[0]
        : ''
      : '';
  }

  appFields.configuration.defaults['maxMinutes'] =
    definition.jobAttributes.maxMinutes;

  if (!definition.notes.hideNodeCountAndCoresPerNode) {
    appFields.configuration.defaults['nodeCount'] =
      definition.jobAttributes.nodeCount;

    appFields.configuration.defaults['coresPerNode'] =
      definition.jobAttributes.coresPerNode;
  }

  appFields.configuration.schema = getConfigurationSchema(
    definition,
    allocations,
    defaultExecSystem,
    queue
  );
  appFields.configuration.fields = getConfigurationFields(
    definition,
    allocations,
    execSystems,
    queue
  );

  // Outputs
  appFields.outputs.schema['name'] = z.string().max(80);
  appFields.outputs.defaults['name'] = `${definition.id}-${
    definition.version
  }_${new Date().toISOString().split('.')[0]}`;
  appFields.outputs.fields['name'] = {
    description: 'A recognizable name for this job.',
    label: 'Job Name',
    name: 'outputs.name',
    key: 'outputs.name',
    required: true,
    type: 'text',
  };
  appFields.outputs.schema['archiveSystemId'] = z.string().optional();
  appFields.outputs.defaults['archiveSystemId'] =
    defaultStorageSystem?.id || definition.jobAttributes.archiveSystemId;
  appFields.outputs.fields['archiveSystemId'] = {
    description:
      'System into which output files are archived after application execution.',
    label: 'Archive System',
    name: 'outputs.archiveSystemId',
    key: 'outputs.archiveSystemId',
    required: false,
    type: 'text',
    placeholder:
      defaultStorageSystem.id || definition.jobAttributes.archiveSystemId,
  };

  appFields.outputs.schema['archiveSystemDir'] = z.string().optional();
  appFields.outputs.defaults[
    'archiveSystemDir'
  ] = `${username}/tapis-jobs-archive/\${JobCreateDate}/\${JobName}-\${JobUUID}`;
  appFields.outputs.fields['archiveSystemDir'] = {
    description:
      'Directory into which output files are archived after application execution.',
    label: 'Archive Directory',
    name: 'outputs.archiveSystemDir',
    key: 'outputs.archiveSystemDir',
    required: false,
    type: 'text',
    placeholder: `${username}/tapis-jobs-archive/\${JobCreateDate}/\${JobName}-\${JobUUID}`,
  };

  return appFields;
};

export default FormSchema;
