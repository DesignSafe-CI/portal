import { z } from 'zod';

import {
  checkAndSetDefaultTargetPath,
  getTargetPathFieldName,
} from '@client/workspace';

const FormSchema = (definition) => {
  const appFields = {
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
  };

  Object.entries(definition.jobAttributes.parameterSet).forEach(
    ([parameterSet, parameterSetValue]) => {
      if (!Array.isArray(parameterSetValue)) return;
      const parameterSetSchema = {};
      const parameterSetFields = {};
      const parameterSetDefaults = {};

      parameterSetValue.forEach((param) => {
        if (param.notes?.isHidden) {
          return;
        }
        const paramId = param.name ?? param.key;

        const field = {
          label: paramId,
          description: param.description,
          required: param.inputMode === 'REQUIRED',
          // readOnly: param.inputMode === 'FIXED',
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
            field.options.map(({ value, label }) => value)
          );
        } else if (param.notes?.fieldType === 'email') {
          field.type = 'email';
          parameterSetSchema[field.label] = z
            .string()
            .email('Must be a valid email.');
        } else if (param.notes?.fieldType === 'number') {
          field.type = 'number';
          parameterSetSchema[field.label] = z.number();
        } else {
          field.type = 'text';
          parameterSetSchema[field.label] = z.string();
        }

        if (!field.required) {
          parameterSetSchema[field.label] =
            parameterSetSchema[field.label].optional();
        }
        if (param.notes?.validator?.regex && param.notes?.validator?.message) {
          try {
            const regex = RegExp(param.notes.validator.regex);
            parameterSetSchema[field.label] = parameterSetSchema[
              field.label
            ].regex(regex, param.notes.validator.message);
          } catch (SyntaxError) {
            console.warn('Invalid regex pattern for app');
          }
        }
        parameterSetFields[field.label] = field;
        parameterSetDefaults[field.label] = param.arg ?? param.value ?? '';
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

  // The default is to not show target path for file inputs.
  const showTargetPathForFileInputs = definition.notes.showTargetPath ?? false;
  (definition.jobAttributes.fileInputs || []).forEach((i) => {
    const input = i;
    if (input.notes?.isHidden) {
      return;
    }

    const field = {
      label: input.name,
      description: input.description,
      required: input.inputMode === 'REQUIRED',
      name: `inputs.${input.name}`,
      key: `inputs.${input.name}`,
      tapisFile: true,
      type: 'text',
      placeholder: 'Browse Data Files',
      readOnly: input.inputMode === 'FIXED',
    };

    appFields.fileInputs.schema[input.name] = z.string();
    appFields.fileInputs.schema[input.name] = appFields.fileInputs.schema[
      input.name
    ].regex(
      /^tapis:\/\//g,
      "Input file must be a valid Tapis URI, starting with 'tapis://'"
    );

    if (!field.required) {
      appFields.fileInputs.schema[input.name] =
        appFields.fileInputs.schema[input.name].optional();
    }

    appFields.fileInputs.fields[input.name] = field;
    appFields.fileInputs.defaults[input.name] =
      input.sourceUrl === null || typeof input.sourceUrl === 'undefined'
        ? ''
        : input.sourceUrl;

    // Add targetDir for all sourceUrl
    if (!showTargetPathForFileInputs) {
      return;
    }
    const targetPathName = getTargetPathFieldName(input.name);
    appFields.fileInputs.schema[targetPathName] = z.string();
    appFields.fileInputs.schema[targetPathName] = appFields.fileInputs.schema[
      targetPathName
    ].regex(
      /^tapis:\/\//g,
      "Input file Target Directory must be a valid Tapis URI, starting with 'tapis://'"
    );

    appFields.fileInputs.schema[targetPathName] = false;
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
      checkAndSetDefaultTargetPath(input.targetPath);
  });
  return appFields;
};

export default FormSchema;
