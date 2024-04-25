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
import { useGetApps, TAppParamsType, TAppResponse } from '@client/hooks';
import { Spinner } from '@client/common-components';
import {
  AppsWizard,
  AppsSubmissionForm,
  FormSchema,
  AppFormProvider,
  useAppFormState,
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

  const [state, setState] = useAppFormState();

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

        // Move to submission
        archiveOnAppError: true,
        appId: app.definition.id,
        appVersion: app.definition.version,
        execSystemId: app.definition.jobAttributes.execSystemId,
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

  // set initial state on app load
  useEffect(() => {
    setState(initialValues);
  }, [app, initialValues]);

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

  const { Header, Footer, Sider, Content } = Layout;
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
  const { handleSubmit, control, formState } = methods;
  const [current, setCurrent] = useState('inputs');

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
      setState({ ...state, ...data });
      setCurrent(steps[current].nextPage);
    },
    [current]
  );
  const handlePreviousStep = useCallback(
    (data) => {
      setState({ ...state, ...data });
      setCurrent(steps[current].prevPage);
    },
    [current]
  );

  return (
    <FormProvider {...methods}>
      <Form
        disabled={readOnly}
        layout="vertical"
        onFinish={methods.handleSubmit(
          (data) => {
            console.log('submit', data);
          },
          (data) => {
            console.log('error submit data', data);
          }
        )}
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
                  {Object.keys(state).length && (
                    <AppsWizard
                      step={steps[current]}
                      handlePreviousStep={handlePreviousStep}
                      handleNextStep={handleNextStep}
                    />
                  )}
                </Col>
                <Col span={10}>
                  <AppsSubmissionForm readOnly={readOnly} />
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
        <AppFormProvider>
          <AppsViewLayoutWrapper />
        </AppFormProvider>
      </Suspense>
      <Outlet />
    </>
  );
};
