import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { Layout, Form, Col, Row, Flex, Alert, Space } from 'antd';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGetAppsSuspense, usePostJobs, useGetSystems } from '@client/hooks';
import { AppsSubmissionDetails } from '../AppsSubmissionDetails/AppsSubmissionDetails';
import { AppsWizard } from '../AppsWizard/AppsWizard';
import { default as AppIcon } from './AppIcon';
import { default as FormSchema } from '../AppsWizard/AppsFormSchema';
import {
  getInputsStep,
  getParametersStep,
  getConfigurationStep,
  getOutputsStep,
} from '../AppsWizard/Steps';
import {
  // AppFormProvider,
  // useAppFormState,
  // getSystemName,
  // getAppQueueValues,
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
  SystemsPushKeysModal,
  getExecSystemsFromApp,
  useGetAppParams,
} from '@client/workspace';
import styles from './layout.module.css';

export const AppsSubmissionForm: React.FC = () => {
  const { data: app } = useGetAppsSuspense(useGetAppParams());

  const {
    data: { executionSystems, storageSystems, defaultStorageSystem },
  } = useGetSystems();

  const { definition, license, defaultSystemNeedsKeys } = app;

  // TODOv3: Load these from state
  const portalAlloc = 'DesignSafe-DCV';
  const allocations = ['TACC-ACI', 'DesignSafe-DCV'];
  const allocationHosts = {};

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

  const execSystems = getExecSystemsFromApp(definition, executionSystems);

  const defaultExecSystem = getExecSystemFromId(
    execSystems,
    definition.jobAttributes.execSystemId
  );

  const { fileInputs, parameterSet } = FormSchema(definition);

  // TODOv3: dynamic exec system and queues
  const initialValues = useMemo(
    () => ({
      inputs: fileInputs.defaults,
      parameters: parameterSet.defaults,
      configuration: {
        execSystemId: defaultExecSystem?.id,
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
        archiveSystemDir: definition.jobAttributes.archiveSystemDir,
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

  const queue = getQueueValueForExecSystem(
    definition,
    defaultExecSystem,
    definition.jobAttributes.execSystemLogicalQueue
  );

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
    missingLicense ||
    !hasStorageSystems ||
    (definition.jobType === 'BATCH' && missingAllocation) ||
    defaultSystemNeedsKeys;

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
    inputs: getInputsStep(fileInputs),
    parameters: getParametersStep(parameterSet),
    configuration: getConfigurationStep(app, execSystems, allocations),
    outputs: getOutputsStep(app),
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
  const {
    mutate: submitJob,
    isPending,
    data: submitResult,
    error: submitError,
  } = usePostJobs();

  const [isModalOpen, setIsModalOpen] = useState({});

  useEffect(() => {
    if (submitResult?.execSys) {
      setIsModalOpen(submitResult.execSys);
    }
  }, [submitResult]);

  const submitJobCallback = (submitData) => {
    const jobData = {
      operation: 'submitJob',

      licenseType: license.type,
      isInteractive: !!definition.notes.isInteractive,
      job: {
        archiveOnAppError: true,
        appId: definition.id,
        appVersion: definition.version,
        execSystemId: definition.jobAttributes.execSystemId,
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
      ...Object.entries(submitData.parameters).map(
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
        onClick={() => setIsModalOpen(defaultStorageSystem)}
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
              message={<>Error: {submitError?.message}</>}
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
                  <Row>
                    <Col span={14}>
                      <AppsWizard
                        step={steps[current]}
                        handlePreviousStep={handlePreviousStep}
                        handleNextStep={handleNextStep}
                      />
                    </Col>
                    <Col span={10}>
                      <AppsSubmissionDetails
                        fields={fields}
                        isSubmitting={isPending}
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
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    </>
  );
};
