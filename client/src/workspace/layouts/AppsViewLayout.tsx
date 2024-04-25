import React, {
  useState,
  useEffect,
  Suspense,
  useMemo,
  useCallback,
} from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { Layout, Form, Col, Row, Flex } from 'antd';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useGetApps,
  TAppParamsType,
  TAppResponse,
  usePostJobs,
} from '@client/hooks';
import { Spinner } from '@client/common-components';
import {
  AppsWizard,
  AppsSubmissionForm,
  FormSchema,
  // AppFormProvider,
  // useAppFormState,
  FormField,
  getSystemName,
  getExecSystemFromId,
  getQueueValueForExecSystem,
  getNodeCountValidation,
  getCoresPerNodeValidation,
  getMaxMinutesValidation,
  getAllocationValidation,
  getExecSystemLogicalQueueValidation,
  isAppTypeBATCH,
  getAppQueueValues,
  isTargetPathField,
  getInputFieldFromTargetPathField,
  isTargetPathEmpty,
} from '@client/workspace';
import styles from './layout.module.css';

export const AppsViewLayoutWrapper: React.FC = () => {
  const { appId } = useParams() as TAppParamsType;
  const location = useLocation();

  const appVersion = new URLSearchParams(location.search).get('appVersion') as
    | string
    | undefined;

  const { data: app } = useGetApps({ appId, appVersion }) as {
    data: TAppResponse;
  };

  // const [state, setState] = useAppFormState();

  // TODOv3: Load these from state
  const defaultSystem = 'designsafe.storage.default';
  const portalAlloc = 'DesignSafe-DCV';
  const allocations = ['A', 'DesignSafe-DCV'];

  // const hasDefaultAllocation =
  // state.allocations.loading ||
  // state.systems.storage.loading ||
  // state.allocations.hosts[defaultHost] ||
  // hasCorral
  const defaultStorageHost = 'cloud.corral.tacc.utexas.edu';
  const hasDefaultAllocation = true;
  const hasStorageSystems = true;

  let missingAllocation = false;

  const { fileInputs, parameterSet } = FormSchema(app);

  const defaultExecSystem = getExecSystemFromId(
    app,
    app.definition.jobAttributes.execSystemId
  );

  // TODOv3: dynamic exec system and queues
  const initialValues = useMemo(
    () => ({
      inputs: fileInputs.defaults,
      parameters: parameterSet.defaults,
      configuration: {
        execSystemId: defaultExecSystem?.id,
        execSystemLogicalQueue: isAppTypeBATCH(app)
          ? app.definition.jobAttributes.execSystemLogicalQueue
          : // (
            //     app.execSystems.batchLogicalQueues.find(
            //       (q) =>
            //         q.name ===
            //         (app.definition.jobAttributes.execSystemLogicalQueue ||
            //           app.execSystems.batchDefaultLogicalQueue)
            //     ) || app.execSystems.batchLogicalQueues[0]
            //   ).name
            '',
        maxMinutes: app.definition.jobAttributes.maxMinutes,
        nodeCount: app.definition.jobAttributes.nodeCount,
        coresPerNode: app.definition.jobAttributes.coresPerNode,
        allocation: isAppTypeBATCH(app)
          ? allocations.includes(portalAlloc)
            ? portalAlloc
            : allocations.length === 1
            ? allocations[0]
            : ''
          : '',
      },
      outputs: {
        name: `${app.definition.id}-${app.definition.version}_${
          new Date().toISOString().split('.')[0]
        }`,
        archiveSystemId:
          app.definition.jobAttributes.archiveSystemId || defaultSystem,
        archiveSystemDir: app.definition.jobAttributes.archiveSystemDir,
      },
    }),
    [app]
  );

  if (isAppTypeBATCH(app) && !hasDefaultAllocation && hasStorageSystems) {
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
  // const execSys = getDefaultExecSystem(app, app.execSystems) ?? ''

  // const currentExecSystem = getExecSystemFromId(app, state.execSystemId);

  const queue = getQueueValueForExecSystem(
    app,
    defaultExecSystem,
    app.definition.jobAttributes.execSystemLogicalQueue
  );

  const schema = {
    // TODOv3 handle fileInputArrays https://jira.tacc.utexas.edu/browse/WP-81
    inputs: z.object(fileInputs.schema),
    parameters: z.object(parameterSet.schema),
    configuration: z.object({
      execSystemLogicalQueue: getExecSystemLogicalQueueValidation(
        app,
        defaultExecSystem
      ),
      maxMinutes: getMaxMinutesValidation(app, queue),
      coresPerNode: getCoresPerNodeValidation(app, queue),
      nodeCount: getNodeCountValidation(app, queue),
      allocation: getAllocationValidation(app, allocations),
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
  const { systemNeedsKeys, pushKeysSystem } = app;
  const missingLicense = app.license.type && !app.license.enabled;

  const readOnly =
    missingLicense ||
    !hasStorageSystems ||
    (app.definition.jobType === 'BATCH' && missingAllocation) ||
    systemNeedsKeys;

  const methods = useForm({
    defaultValues: initialValues,
    resolver: zodResolver(z.object(schema)),
    mode: 'onChange',
  });
  const { handleSubmit, control, reset } = methods;

  useEffect(() => {
    reset(initialValues);
  }, [initialValues]);

  const [current, setCurrent] = useState('inputs');

  const fields = {
    inputs: fileInputs.fields,
    parameters: parameterSet.fields,
    configuration: {
      execSystemLogicalQueue: {},
      maxMinutes: {},
      coresPerNode: {},
      nodeCount: {},
      allocation: {},
    },
    outputs: {
      name: {},
      archiveSystemId: {},
      archiveSystemDir: {},
    },
  };

  const steps = {
    inputs: {
      title: 'Inputs',
      nextPage: 'parameters',
      content: (
        <>
          {Object.entries(fileInputs.fields).map(([name, field]) => {
            // TODOv3 handle fileInputArrays https://jira.tacc.utexas.edu/browse/WP-81
            return <FormField control={control} {...field} />;
          })}
        </>
      ),
    },
    parameters: {
      title: 'Parameters',
      prevPage: 'inputs',
      nextPage: 'configuration',
      content: (
        <>
          {Object.entries(parameterSet.fields).map(
            ([parameterSet, parameterValue]) => {
              return Object.entries(parameterValue).map(([name, field]) => {
                return <FormField control={control} {...field} />;
              });
            }
          )}
        </>
      ),
    },
    configuration: {
      title: 'Configuration',
      prevPage: 'parameters',
      nextPage: 'outputs',
      content: (
        <>
          {app.definition.jobType === 'BATCH' && (
            <FormField
              control={control}
              label="Queue"
              name="configuration.execSystemLogicalQueue"
              description="Select the queue this job will execute on."
              type="select"
              required
              // TODOv3: Dynamic system queues
              options={getAppQueueValues(
                app,
                app.execSystems[0].batchLogicalQueues
              ).map((q) => ({ value: q, label: q }))}
            />
          )}
          <FormField
            control={control}
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
          {!app.definition.notes.hideNodeCountAndCoresPerNode ? (
            <>
              <FormField
                control={control}
                label="Cores Per Node"
                description="Number of processors (cores) per node for the job. e.g. a selection of 16 processors per node along with 4 nodes will result in 16 processors on 4 nodes, with 64 processors total."
                name="configuration.coresPerNode"
                type="number"
              />
              <FormField
                control={control}
                label="Node Count"
                description="Number of requested process nodes for the job."
                name="configuration.nodeCount"
                type="number"
              />
            </>
          ) : null}
          {app.definition.jobType === 'BATCH' && (
            <FormField
              control={control}
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
    },
    outputs: {
      title: 'Outputs',
      prevPage: 'configuration',
      content: (
        <>
          <FormField
            control={control}
            label="Job Name"
            description="A recognizable name for this job."
            name="outputs.name"
            type="text"
            required
          />
          {!app.definition.notes.isInteractive && (
            <>
              <FormField
                control={control}
                label="Archive System"
                description="System into which output files are archived after application execution."
                name="outputs.archiveSystemId"
                type="text"
                placeholder={app.definition.jobAttributes.archiveSystemId} // || defaultSystem}
              />
              <FormField
                control={control}
                label="Archive Directory"
                description="Directory into which output files are archived after application execution."
                name="outputs.archiveSystemDir"
                type="text"
                placeholder={
                  app.definition.jobAttributes.archiveSystemDir ||
                  'HOST_EVAL($HOME)/tapis-jobs-archive/${JobCreateDate}/${JobName}-${JobUUID}'
                }
              />
            </>
          )}
        </>
      ),
    },
  };

  const handleNextStep = useCallback(
    (data) => {
      // setState({ ...state, ...data });
      setCurrent(steps[current].nextPage);
    },
    [current]
  );
  const handlePreviousStep = useCallback(
    (data) => {
      // setState({ ...state, ...data });
      setCurrent(steps[current].prevPage);
    },
    [current]
  );
  const { mutate: submitJob, isPending } = usePostJobs();

  const submitJobCallback = (data) => {
    const jobData = {
      operation: 'submitJob',

      licenseType: app.license.type,
      isInteractive: !!app.definition.notes.isInteractive,
      job: {
        archiveOnAppError: true,
        appId: app.definition.id,
        appVersion: app.definition.version,
        execSystemId: app.definition.jobAttributes.execSystemId,
        ...data.configuration,
        ...data.outputs,
      },
    };

    // Transform input field values into format that jobs service wants.
    // File Input structure will have 2 fields if target path is required by the app.
    // field 1 - has source url
    // field 2 - has target path for the source url.
    // tapis wants only 1 field with 2 properties - source url and target path.
    // The logic below handles that scenario by merging the related fields into 1 field.
    jobData.job.fileInputs = Object.values(
      Object.entries(data.inputs)
        .map(([k, v]) => {
          // filter out read only inputs. 'FIXED' inputs are tracked as readOnly
          if (fileInputs.fields?.[k].readOnly) return;
          return {
            name: k,
            sourceUrl: !isTargetPathField(k) ? v : null,
            targetDir: isTargetPathField(k) ? v : null,
          };
        })
        .filter((v) => v) //filter nulls
        .reduce((acc, entry) => {
          // merge input field and targetPath fields into one.
          const key = getInputFieldFromTargetPathField(entry.name);
          if (!acc[key]) {
            acc[key] = {};
          }
          acc[key]['name'] = key;
          acc[key]['sourceUrl'] = acc[key]['sourceUrl'] ?? entry.sourceUrl;
          acc[key]['targetPath'] = acc[key]['targetPath'] ?? entry.targetDir;
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
      ...Object.entries(data.parameters).map(
        ([parameterSet, parameterValue]) => {
          return {
            [parameterSet]: Object.entries(parameterValue)
              .map(([k, v]) => {
                if (!v) return;
                // filter read only parameters. 'FIXED' parameters are tracked as readOnly
                if (parameterSet.fields?.[k].readOnly) return;
                // Convert the value to a string, if necessary
                const transformedValue =
                  typeof v === 'number' ? v.toString() : v;
                return parameterSet === 'envVariables'
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
      if (!jobData.job.parameterSet.schedulerOptions) {
        jobData.job.parameterSet.schedulerOptions = [];
      }
      jobData.job.parameterSet.schedulerOptions.push({
        name: 'TACC Allocation',
        description: 'The TACC allocation associated with this job execution',
        include: true,
        arg: `-A ${jobData.job.allocation}`,
      });
      delete jobData.job.allocation;
    }

    submitJob(jobData);
  };

  return (
    <FormProvider {...methods}>
      <Form
        disabled={readOnly}
        layout="vertical"
        onFinish={handleSubmit(submitJobCallback, (data) => {
          console.log('error submit data', data);
        })}
      >
        <fieldset>
          <Layout style={layoutStyle}>
            <Header style={headerStyle}>
              <Flex justify="space-between">
                {app.definition.notes.label || app.definition.id}
                <a href="/user-guide">View User Guide</a>
              </Flex>
            </Header>
            <Content>
              <Row>
                <Col span={14}>
                  {/* {Object.keys(state).length && ( */}
                  <AppsWizard
                    step={steps[current]}
                    handlePreviousStep={handlePreviousStep}
                    handleNextStep={handleNextStep}
                  />
                  {/* )} */}
                </Col>
                <Col span={10}>
                  <AppsSubmissionForm
                    fields={fields}
                    isSubmitting={isPending}
                  />
                </Col>
              </Row>
            </Content>
          </Layout>
        </fieldset>
      </Form>
    </FormProvider>
  );
};

export const AppsViewLayout: React.FC = () => {
  return (
    <>
      <Suspense
        fallback={
          <Layout>
            <Spinner />
          </Layout>
        }
      >
        {/* <AppFormProvider> */}
        <AppsViewLayoutWrapper />
        {/* </AppFormProvider> */}
      </Suspense>
      <Outlet />
    </>
  );
};
