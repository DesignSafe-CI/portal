import { z } from 'zod';

import {
  checkAndSetDefaultTargetPath,
  getTargetPathFieldName,
} from './AppsFormUtils';

const FormSchema = (app) => {
  const appFields = {
    // parameterSet: {
    //   appArgs: {},
    //   containerArgs: {},
    //   schedulerOptions: {},
    //   envVariables: {},
    // },
    fileInputs: {
      defaults: {},
      fields: {},
      schema: {},
    },
    parameterSet: {
      defaults: {
        appArgs: {},
        containerArgs: {},
        schedulerOptions: {},
        envVariables: {},
      },
      fields: {
        appArgs: {},
        containerArgs: {},
        schedulerOptions: {},
        envVariables: {},
      },
      schema: {
        appArgs: {},
        containerArgs: {},
        schedulerOptions: {},
        envVariables: {},
      },
    },
    // defaults: {
    //   fileInputs: {},
    // parameterSet: {
    //   appArgs: {},
    //   containerArgs: {},
    //   schedulerOptions: {},
    //   envVariables: {},
    // },
    // },
    // schema: {
    //   fileInputs: {},
    //   parameterSet: {
    //     appArgs: {},
    //     containerArgs: {},
    //     schedulerOptions: {},
    //     envVariables: {},
    //   },
    // },
  };

  Object.entries(app.definition.jobAttributes.parameterSet).forEach(
    ([parameterSet, parameterSetValue]) => {
      if (!Array.isArray(parameterSetValue)) return;

      parameterSetValue.forEach((param) => {
        if (param.notes?.isHidden) {
          return;
        }

        const field = {
          label: param.name ?? param.key,
          description: param.description,
          required: param.inputMode === 'REQUIRED',
          readOnly: param.inputMode === 'FIXED',
          parameterSet: parameterSet,
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
          appFields.parameterSet.schema[parameterSet][field.label] = z.enum(
            field.options.map((enumVal) => {
              if (typeof enumVal === 'string') {
                return enumVal;
              }
              return Object.keys(enumVal)[0];
            })
          );
        } else {
          if (param.notes?.fieldType === 'email') {
            field.type = 'email';
            appFields.parameterSet.schema[parameterSet][field.label] = z
              .string()
              .email('Must be a valid email.');
          } else if (param.notes?.fieldType === 'number') {
            field.type = 'number';
            appFields.parameterSet.schema[parameterSet][field.label] =
              z.number();
          } else {
            field.type = 'text';
            appFields.parameterSet.schema[parameterSet][field.label] =
              z.string();
          }
        }
        if (!field.required) {
          appFields.parameterSet.schema[parameterSet][field.label] =
            appFields.parameterSet.schema[parameterSet][field.label].optional();
        }
        if (param.notes?.validator?.regex && param.notes?.validator?.message) {
          try {
            const regex = RegExp(param.notes.validator.regex);
            appFields.parameterSet.schema[parameterSet][field.label] =
              appFields.parameterSet.schema[parameterSet][field.label].regex(
                regex,
                param.notes.validator.message
              );
          } catch (SyntaxError) {
            console.warn('Invalid regex pattern for app');
          }
        }
        appFields.parameterSet.fields[parameterSet][field.label] = field;
        appFields.parameterSet.defaults[parameterSet][field.label] =
          param.arg ?? param.value ?? '';
      });
    }
  );

  // The default is to not show target path for file inputs.
  const showTargetPathForFileInputs =
    app.definition.notes.showTargetPath ?? false;
  (app.definition.jobAttributes.fileInputs || []).forEach((i) => {
    const input = i;
    if (input.notes?.isHidden) {
      return;
    }

    const field = {
      label: input.name,
      description: input.description,
      required: input.inputMode === 'REQUIRED',
      readOnly: input.inputMode === 'FIXED',
    };

    field.type = 'text';

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
      type: 'text',
    };
    appFields.fileInputs.defaults[targetPathName] =
      checkAndSetDefaultTargetPath(input.targetPath);
  });
  return appFields;
};

export default FormSchema;
