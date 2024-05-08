import { getAppQueueValues } from '../utils';
import { FormField } from './FormField';

export const getInputsStep = (fields) => ({
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

export const getParametersStep = (fields) => ({
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

export const getConfigurationStep = (definition, execSystems, allocations) => ({
  title: 'Configuration',
  prevPage: 'parameters',
  nextPage: 'outputs',
  content: (
    <>
      {definition.jobType === 'BATCH' && (
        <FormField
          label="Queue"
          name="configuration.execSystemLogicalQueue"
          description="Select the queue this job will execute on."
          type="select"
          required
          // TODOv3: Dynamic system queues
          options={getAppQueueValues(
            definition,
            execSystems[0].batchLogicalQueues
          ).map((q) => ({ value: q, label: q }))}
        />
      )}
      <FormField
        label="Maximum Job Runtime (minutes)"
        // description={`The maximum number of minutes you expect this job to run for. Maximum possible is ${getQueueMaxMinutes(
        //   app,
        //   state.execSys,
        //   state.execSystemLogicalQueue
        // )} minutes. After this amount of time your job will end. Shorter run times result in shorter queue wait times.`}
        name="configuration.maxMinutes"
        type="number"
        required
      />
      {!definition.notes.hideNodeCountAndCoresPerNode ? (
        <>
          <FormField
            label="Cores Per Node"
            description="Number of processors (cores) per node for the job. e.g. a selection of 16 processors per node along with 4 nodes will result in 16 processors on 4 nodes, with 64 processors total."
            name="configuration.coresPerNode"
            type="number"
          />
          <FormField
            label="Node Count"
            description="Number of requested process nodes for the job."
            name="configuration.nodeCount"
            type="number"
          />
        </>
      ) : null}
      {definition.jobType === 'BATCH' && (
        <FormField
          label="Allocation"
          name="configuration.allocation"
          description="Select the project allocation you would like to use with this job submission."
          type="select"
          required
          options={[
            { label: '', hidden: true, disabled: true },
            ...allocations.sort().map((projectId) => ({
              value: projectId,
              label: projectId,
            })),
          ]}
        />
      )}
    </>
  ),
});

export const getOutputsStep = (
  definition,
  defaultStorageSystemId,
  username
) => ({
  title: 'Outputs',
  prevPage: 'configuration',
  content: (
    <>
      <FormField
        key="name"
        label="Job Name"
        description="A recognizable name for this job."
        name="outputs.name"
        type="text"
        required
      />
      {!definition.notes.isInteractive && (
        <>
          <FormField
            label="Archive System"
            description="System into which output files are archived after application execution."
            name="outputs.archiveSystemId"
            type="text"
            placeholder={
              defaultStorageSystemId || definition.jobAttributes.archiveSystemId
            }
          />
          <FormField
            label="Archive Directory"
            description="Directory into which output files are archived after application execution."
            name="outputs.archiveSystemDir"
            type="text"
            placeholder={`${username}/tapis-jobs-archive/\${JobCreateDate}/\${JobName}-\${JobUUID}`}
          />
        </>
      )}
    </>
  ),
});
