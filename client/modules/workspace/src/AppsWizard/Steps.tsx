import { FormField } from './FormField';
import { TField } from '../AppsWizard/AppsFormSchema';

export const getInputsStep = (fields: { [dynamic: string]: TField }) => ({
  title: 'Inputs',
  nextPage: 'parameters',
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
  prevPage: 'inputs',
  nextPage: 'configuration',
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

const configurationFieldOrder = [
  'execSystemLogicalQueue',
  'maxMinutes',
  'nodeCount',
  'coresPerNode',
  'allocation',
];

export const getConfigurationStep = (fields: { [key: string]: TField }) => ({
  title: 'Configuration',
  prevPage: 'parameters',
  nextPage: 'outputs',
  content: (
    <>
      {configurationFieldOrder.map((key) => {
        const field = fields[key];
        if (!field) {
          return null;
        }
        return <FormField {...field} />;
      })}
    </>
  ),
});

const outputFieldOrder = ['name', 'archiveSystemId', 'archiveSystemDir'];
export const getOutputsStep = (fields: { [key: string]: TField }) => ({
  title: 'Outputs',
  prevPage: 'configuration',
  content: (
    <>
      {outputFieldOrder.map((key) => {
        const field = fields[key];
        if (!field) {
          return null;
        }
        return <FormField {...field} />;
      })}
    </>
  ),
});
