import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { Layout, Form, Col, Row, Flex, Alert, Space } from 'antd';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useGetAppsSuspense,
  usePostJobs,
  useGetSystems,
  useAuthenticatedUser,
  TTapisSystem,
  TTapisSystemQueue,
  TUser,
  TAppFileInput,
  TConfigurationValues,
  TOutputValues,
  TJobSubmit,
  TParameterSetSubmit,
  TJobBody,
} from '@client/hooks';
import { AppsSubmissionDetails } from '../AppsSubmissionDetails/AppsSubmissionDetails';
import { AppsWizard } from '../AppsWizard/AppsWizard';
import { default as AppIcon } from './AppIcon';
import {
  default as FormSchema,
  TField,
  TFileInputsDefaults,
  TParameterSetDefaults,
} from '../AppsWizard/AppsFormSchema';
import {
  getInputsStep,
  getParametersStep,
  getConfigurationStep,
  getOutputsStep,
} from '../AppsWizard/Steps';
import { SystemsPushKeysModal } from '../SystemsPushKeysModal/SystemsPushKeysModal';
import {
  // AppFormProvider,
  // useAppFormState,
  // getSystemName,
  getQueueMaxMinutes,
  getAppQueueValues,
  getExecSystemFromId,
  getQueueValueForExecSystem,
  getNodeCountValidation,
  getCoresPerNodeValidation,
  getMaxMinutesValidation,
  getAllocationValidation,
  getExecSystemLogicalQueueValidation,
  isAppTypeBATCH,
  isTargetPathField,
  getInputFieldFromTargetPathField,
  isTargetPathEmpty,
  getExecSystemsFromApp,
  useGetAppParams,
} from '../utils';
// import styles from './layout.module.css';

type FormValues = {
  inputs: TFileInputsDefaults;
  parameters: TParameterSetDefaults;
  configuration: TConfigurationValues;
  outputs: TOutputValues;
};

export const AppsSubmissionForm: React.FC = () => {
  const { data: app } = useGetAppsSuspense(useGetAppParams());

  const {
    data: { executionSystems, storageSystems, defaultStorageSystem },
  } = useGetSystems();

  const {
    user: { username },
  } = useAuthenticatedUser() as { user: TUser };

  const { definition, license, defaultSystemNeedsKeys } = app;

  // TODOv3: Load these from state
  const portalAlloc = 'DesignSafe-DCV';
  const allocations = ['TACC-ACI', 'DesignSafe-DCV'];
  const allocationHosts: { [dynamic: string]: string } = {};

  // const [state, setState] = useAppFormState();

  const defaultStorageHost = defaultStorageSystem.host;
  const hasCorral = ['data.tacc.utexas.edu', 'corral.tacc.utexas.edu'].some(
    (s) => defaultStorageHost?.endsWith(s)
  );
  const hasDefaultAllocation =
    // state.allocations.loading ||
    // state.systems.storage.loading ||
    allocationHosts[defaultStorageHost] || hasCorral;
  const hasStorageSystems = !!storageSystems.length;

  let missingAllocation = false;

  const execSystems = getExecSystemsFromApp(
    definition,
    executionSystems as TTapisSystem[]
  );

  const defaultExecSystem = getExecSystemFromId(
    execSystems,
    definition.jobAttributes.execSystemId
  ) as TTapisSystem;

  const { fileInputs, parameterSet } = FormSchema(definition);

  // TODOv3: dynamic exec system and queues
  const initialValues: FormValues = useMemo(
    () => ({
      inputs: fileInputs.defaults,
      parameters: parameterSet.defaults,
      configuration: {
        // execSystemId: defaultExecSystem?.id,
        execSystemLogicalQueue: isAppTypeBATCH(definition)
          ? definition.jobAttributes.execSystemLogicalQueue
          : // (
            //     app.execSystems.batchLogicalQueues.find(
            //       (q) =>
            //         q.name ===
            //         (app.definition.jobAttributes.execSystemLogicalQueue ||
            //           app.execSystems.batchDefaultLogicalQueue)
            //     ) || app.execSystems.batchLogicalQueues[0]
            //   ).name
            '',
        maxMinutes: definition.jobAttributes.maxMinutes,
        nodeCount: definition.jobAttributes.nodeCount,
        coresPerNode: definition.jobAttributes.coresPerNode,
        allocation: isAppTypeBATCH(definition)
          ? allocations.includes(portalAlloc)
            ? portalAlloc
            : allocations.length === 1
            ? allocations[0]
            : ''
          : '',
      },
      outputs: {
        name: `${definition.id}-${definition.version}_${
          new Date().toISOString().split('.')[0]
        }`,
        archiveSystemId:
          defaultStorageSystem?.id || definition.jobAttributes.archiveSystemId,
        archiveSystemDir: `${username}/tapis-jobs-archive/\${JobCreateDate}/\${JobName}-\${JobUUID}`,
      },
    }),
    [definition]
  );

  if (
    isAppTypeBATCH(definition) &&
    !hasDefaultAllocation &&
    hasStorageSystems
  ) {
    // jobSubmission.error = true;
    // jobSubmission.response = {
    //   message: `You need an allocation on ${getSystemName(
    //     defaultStorageHost
    //   )} to run this application.`,
    // };
    missingAllocation = true;
  } else if (!allocations.length) {
    // jobSubmission.error = true;
    // jobSubmission.response = {
    //   message: `You need an allocation on ${getSystemName(
    //     app.exec_sys.host
    //   )} to run this application.`,
    // };
    missingAllocation = true;
  }

  // const exec_sys = getExecSystemFromId(app, state.execSystemId);
  // const queue = getQueueValueForExecSystem(
  //   app,
  //   exec_sys,
  //   state.execSystemLogicalQueue
  // );

  // const currentExecSystem = getExecSystemFromId(app, state.execSystemId);

  const queue = getQueueValueForExecSystem({
    definition,
    exec_sys: defaultExecSystem,
    queue_name: definition.jobAttributes.execSystemLogicalQueue,
  }) as TTapisSystemQueue;

  const schema = {
    // TODOv3 handle fileInputArrays https://jira.tacc.utexas.edu/browse/WP-81
    inputs: z.object(fileInputs.schema),
    parameters: z.object(parameterSet.schema),
    configuration: z.object({
      execSystemLogicalQueue: getExecSystemLogicalQueueValidation(
        definition,
        defaultExecSystem
      ),
      maxMinutes: getMaxMinutesValidation(definition, queue),
      coresPerNode: getCoresPerNodeValidation(definition, queue),
      nodeCount: getNodeCountValidation(definition, queue),
      allocation: getAllocationValidation(definition, allocations),
    }),
    outputs: z.object({
      name: z.string().max(80),
      archiveSystemId: z.string().optional(),
      archiveSystemDir: z.string().optional(),
    }),
  };

  const { Header, Content } = Layout;
  const headerStyle = {
    background: 'transparent',
    paddingLeft: 0,
    paddingRight: 0,
    borderBottom: '1px solid #707070',
    fontSize: 16,
  };
  const layoutStyle = {
    overflow: 'hidden',
  };

  const missingLicense = license.type && !license.enabled;

  const readOnly =
    !!missingLicense ||
    !hasStorageSystems ||
    (definition.jobType === 'BATCH' && missingAllocation) ||
    !!defaultSystemNeedsKeys;

  const methods = useForm({
    defaultValues: initialValues,
    resolver: zodResolver(z.object(schema)),
    mode: 'onChange',
  });
  const { handleSubmit, reset } = methods;

  useEffect(() => {
    reset(initialValues);
  }, [initialValues]);

  const [current, setCurrent] = useState('inputs');

  const fields: {
    [dynamic: string]: {
      [dynamic: string]: TField | { [dynamic: string]: TField };
    };
  } = {
    inputs: fileInputs.fields,
    parameters: parameterSet.fields,
    configuration: {
      execSystemLogicalQueue: {
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
      },
      maxMinutes: {
        description: `The maximum number of minutes you expect this job to run for. Maximum possible is ${getQueueMaxMinutes(
          definition,
          defaultExecSystem,
          queue.name
        )} minutes. After this amount of time your job will end. Shorter run times result in shorter queue wait times.`,
        label: 'Maximum Job Runtime (minutes)',
        name: 'configuration.maxMinutes',
        key: 'configuration.maxMinutes',
        required: true,
        type: 'number',
      },
      coresPerNode: {
        description:
          'Number of processors (cores) per node for the job. e.g. a selection of 16 processors per node along with 4 nodes will result in 16 processors on 4 nodes, with 64 processors total.',
        label: 'Cores Per Node',
        name: 'configuration.coresPerNode',
        key: 'configuration.coresPerNode',
        required: true,
        type: 'number',
      },
      nodeCount: {
        description: 'Number of requested process nodes for the job.',
        label: 'Node Count',
        name: 'configuration.nodeCount',
        key: 'configuration.nodeCount',
        required: true,
        type: 'number',
      },
      allocation: {
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
      },
    },
    outputs: {
      name: {
        description: 'A recognizable name for this job.',
        label: 'Job Name',
        name: 'outputs.name',
        key: 'outputs.name',
        required: true,
        type: 'text',
      },
      archiveSystemId: {
        description:
          'System into which output files are archived after application execution.',
        label: 'Archive System',
        name: 'outputs.archiveSystemId',
        key: 'outputs.archiveSystemId',
        required: false,
        type: 'text',
        placeholder:
          defaultStorageSystem.id || definition.jobAttributes.archiveSystemId,
      },
      archiveSystemDir: {
        description:
          'Directory into which output files are archived after application execution.',
        label: 'Archive Directory',
        name: 'outputs.archiveSystemDir',
        key: 'outputs.archiveSystemDir',
        required: false,
        type: 'text',
        placeholder: `${username}/tapis-jobs-archive/\${JobCreateDate}/\${JobName}-\${JobUUID}`,
      },
    },
  };

  interface TStep {
    [dynamic: string]: {
      title: string;
      nextPage?: string;
      prevPage?: string;
      content: JSX.Element;
    };
  }

  const steps: TStep = {
    inputs: getInputsStep(fileInputs.fields),
    parameters: getParametersStep(parameterSet.fields),
    configuration: getConfigurationStep(definition, execSystems, allocations),
    outputs: getOutputsStep(definition, defaultStorageSystem.id, username),
  };

  const handleNextStep = useCallback(() => {
    // setState({ ...state, ...data });
    const nextPage = steps[current].nextPage;
    nextPage && setCurrent(nextPage);
  }, [current]);
  const handlePreviousStep = useCallback(() => {
    // setState({ ...state, ...data });
    const prevPage = steps[current].prevPage;
    prevPage && setCurrent(prevPage);
  }, [current]);
  const {
    mutate: submitJob,
    isPending,
    isSuccess,
    data: submitResult,
    error: submitError,
  } = usePostJobs();

  const [pushKeysSystem, setPushKeysSystem] = useState<
    TTapisSystem | undefined
  >();

  useEffect(() => {
    if (submitResult?.execSys) {
      setPushKeysSystem(submitResult.execSys);
    } else if (isSuccess) {
      reset(initialValues);
    }
  }, [submitResult]);

  const submitJobCallback = (submitData: FormValues) => {
    const jobData: Omit<TJobBody, 'job'> & { job: TJobSubmit } = {
      operation: 'submitJob' as const,
      licenseType: license.type,
      isInteractive: !!definition.notes.isInteractive,
      job: {
        archiveOnAppError: true,
        appId: definition.id,
        appVersion: definition.version,
        execSystemId: definition.jobAttributes.execSystemId,
        fileInputs: {} as TAppFileInput[],
        parameterSet: {} as TParameterSetSubmit,
        ...submitData.configuration,
        ...submitData.outputs,
      },
    };

    // Transform input field values into format that jobs service wants.
    // File Input structure will have 2 fields if target path is required by the app.
    // field 1 - has source url
    // field 2 - has target path for the source url.
    // tapis wants only 1 field with 2 properties - source url and target path.
    // The logic below handles that scenario by merging the related fields into 1 field.
    jobData.job.fileInputs = Object.values(
      Object.entries(submitData.inputs)
        .map(([k, v]) => {
          // filter out read only inputs. 'FIXED' inputs are tracked as readOnly
          if (fileInputs.fields?.[k].readOnly) return;
          return {
            name: k,
            sourceUrl: !isTargetPathField(k) ? v : null,
            targetPath: isTargetPathField(k) ? v : null,
          };
        })
        .filter((v): v is Required<TAppFileInput> => !!v) //filter nulls
        .reduce((acc: { [dynamic: string]: TAppFileInput }, entry) => {
          // merge input field and targetPath fields into one.
          const key = getInputFieldFromTargetPathField(entry.name);
          if (!acc[key]) {
            acc[key] = {} as TAppFileInput;
          }
          acc[key]['name'] = key;
          acc[key]['sourceUrl'] = acc[key]['sourceUrl'] ?? entry.sourceUrl;
          acc[key]['targetPath'] = acc[key]['targetPath'] ?? entry.targetPath;
          return acc;
        }, {})
    )
      .flat()
      .filter((fileInput) => fileInput.sourceUrl) // filter out any empty values
      .map((fileInput) => {
        if (isTargetPathEmpty(fileInput.targetPath)) {
          return {
            name: fileInput.name,
            sourceUrl: fileInput.sourceUrl,
          };
        }
        return fileInput;
      });

    jobData.job.parameterSet = Object.assign(
      {},
      ...Object.entries(submitData.parameters).map(
        ([sParameterSet, sParameterValue]) => {
          return {
            [sParameterSet]: Object.entries(sParameterValue)
              .map(([k, v]) => {
                if (!v) return;
                // filter read only parameters. 'FIXED' parameters are tracked as readOnly
                if (parameterSet.fields?.[k]?.readOnly) return;
                // Convert the value to a string, if necessary
                const transformedValue =
                  typeof v === 'number' ? v.toString() : v;
                return sParameterSet === 'envVariables'
                  ? { key: k, value: transformedValue }
                  : { name: k, arg: transformedValue };
              })
              .filter((v) => v), // filter out any empty values
          };
        }
      )
    );

    // Add allocation scheduler option
    if (jobData.job.allocation) {
      if (!jobData.job.parameterSet!.schedulerOptions) {
        jobData.job.parameterSet!.schedulerOptions = [];
      }
      jobData.job.parameterSet!.schedulerOptions.push({
        name: 'TACC Allocation',
        description: 'The TACC allocation associated with this job execution',
        arg: `-A ${jobData.job.allocation}`,
      });
      delete jobData.job.allocation;
    }

    submitJob(jobData);
  };

  const defaultSystemNeedsKeysMessage = defaultStorageSystem.notes
    ?.keyservice ? (
    <span>
      For help,{' '}
      <Link className="wb-link" to={`tickets/create`}>
        submit a ticket.
      </Link>
    </span>
  ) : (
    <span>
      If this is your first time logging in, you may need to&nbsp;
      <a
        className="data-files-nav-link"
        type="button"
        href="#"
        onClick={() => setPushKeysSystem(defaultStorageSystem)}
      >
        push your keys
      </a>
      .
    </span>
  );

  return (
    <>
      <Layout style={layoutStyle}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Header style={headerStyle}>
            <Flex justify="space-between">
              <div>
                <AppIcon name={definition.notes.icon || 'Generic-App'} />
                {definition.notes.label || definition.id}
              </div>
              {definition.notes.helpUrl && (
                <a href={definition.notes.helpUrl}>View User Guide</a>
              )}
            </Flex>
          </Header>
          {submitResult && (
            <Alert
              message={
                <>
                  Job submitted successfully. Monitor its progress in{' '}
                  <NavLink to={'/history'}>Job Status</NavLink>.
                </>
              }
              type="success"
              closable
              showIcon
            />
          )}
          {submitError && (
            <Alert
              message={
                <>
                  Job Submit Error:{' '}
                  {submitError.response?.data.message || submitError.message}
                </>
              }
              type="warning"
              closable
              showIcon
            />
          )}
          {defaultSystemNeedsKeys && (
            <Alert
              message={
                <>
                  There was a problem accessing your default My Data file
                  system. {defaultSystemNeedsKeysMessage}
                </>
              }
              type="warning"
              closable
              showIcon
            />
          )}
          <Content>
            <FormProvider {...methods}>
              <Form
                disabled={readOnly}
                layout="vertical"
                onFinish={handleSubmit(submitJobCallback, (error) => {
                  console.log('error submit data', error);
                })}
              >
                <fieldset>
                  <Row gutter={[64, 16]} align="top">
                    <Col span={14}>
                      <AppsWizard
                        step={steps[current]}
                        handlePreviousStep={handlePreviousStep}
                        handleNextStep={handleNextStep}
                      />
                    </Col>
                    <Col span={10}>
                      <AppsSubmissionDetails
                        schema={schema}
                        fields={fields}
                        isSubmitting={isPending}
                        setCurrent={setCurrent}
                      />
                    </Col>
                  </Row>
                </fieldset>
              </Form>
            </FormProvider>
          </Content>
        </Space>
      </Layout>
      <SystemsPushKeysModal
        isModalOpen={pushKeysSystem}
        setIsModalOpen={setPushKeysSystem}
      />
    </>
  );
};
