import { z, ZodType } from 'zod';
import { TTapisApp, TJobKeyValuePair, TJobArgSpec } from '@client/hooks';

import { checkAndSetDefaultTargetPath, getTargetPathFieldName } from '../utils';

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
  placeholder?: string;
  readOnly?: boolean;
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
};

const FormSchema = (definition: TTapisApp) => {
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
          (<TJobArgSpec>param).name ?? (<TJobKeyValuePair>param).key;

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
    };

    appFields.fileInputs.schema[input.name] = z.string();
    appFields.fileInputs.schema[input.name] = (<z.ZodString>(
      appFields.fileInputs.schema[input.name]
    )).regex(
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
  return appFields;
};

export default FormSchema;
