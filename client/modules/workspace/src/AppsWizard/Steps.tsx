import { FormField } from './FormField';
import { TField, fieldDisplayOrder } from '../AppsWizard/AppsFormSchema';

export const stepKeys = ['inputs', 'parameters', 'configuration', 'outputs'];

export const getInputsStep = (fields: { [dynamic: string]: TField }) => ({
  title: 'Inputs',
  content: (
    <>
      {Object.values(fields).map((field) => {
        // TODOv3 handle fileInputArrays https://jira.tacc.utexas.edu/browse/WP-81
        return <FormField {...field} />;
      })}
    </>
  ),
});

export const getParametersStep = (fields: {
  [dynamic: string]: { [dynamic: string]: TField };
}) => ({
  title: 'Parameters',
  content: (
    <>
      {Object.values(fields).map((parameterValue) => {
        return Object.values(parameterValue).map((field) => {
          return <FormField {...field} />;
        });
      })}
    </>
  ),
});

export const getConfigurationStep = (fields: { [key: string]: TField }) => ({
  title: 'Configuration',
  content: (
    <>
      {fieldDisplayOrder['configuration'].map((key) => {
        const field = fields[key];
        if (!field) {
          return null;
        }
        return <FormField {...field} />;
      })}
    </>
  ),
});

export const getOutputsStep = (fields: { [key: string]: TField }) => ({
  title: 'Outputs',
  content: (
    <>
      {fieldDisplayOrder['outputs'].map((key) => {
        const field = fields[key];
        if (!field) {
          return null;
        }
        return <FormField {...field} />;
      })}
    </>
  ),
});
