import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { NavLink } from 'react-router-dom';
import { Layout, Form, Col, Row, Alert, Button, Space } from 'antd';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { JobSubmitButton } from '../JobSubmitButton/JobSubmitButton';
import {
  useGetAppsSuspense,
  useGetJobSuspense,
  usePostJobs,
  useGetSystems,
  useAuthenticatedUser,
  TTapisSystem,
  TUser,
  TAppFileInput,
  TJobSubmit,
  TParameterSetSubmit,
  TJobBody,
  useGetAllocationsSuspense,
  TTapisJob,
  TTapisApp,
  useInteractiveModalContext,
  TInteractiveModalContext,
} from '@client/hooks';
import { AppsSubmissionDetails } from '../AppsSubmissionDetails/AppsSubmissionDetails';
import { AppsWizard } from '../AppsWizard/AppsWizard';
import {
  default as FormSchema,
  TField,
  TFormValues,
  TAppFieldSchema,
  getConfigurationSchema,
  getConfigurationFields,
  buildMapOfAllocationsToExecSystems,
} from '../AppsWizard/AppsFormSchema';
import {
  getInputsStep,
  getParametersStep,
  getConfigurationStep,
  getOutputsStep,
  stepKeys,
} from '../AppsWizard/Steps';
import { SystemsPushKeysModal } from '../SystemsPushKeysModal/SystemsPushKeysModal';
import {
  areArraysEqual,
  getSystemName,
  getExecSystemFromId,
  getQueueValueForExecSystem,
  isAppTypeBATCH,
  isTargetPathField,
  getInputFieldFromTargetPathField,
  isTargetPathEmpty,
  getExecSystemsFromApp,
  useGetAppParams,
  updateValuesForQueue,
  getDefaultExecSystem,
  getAllocationList,
  mergeConfigurationDefaultsWithJobData,
  mergeParameterSetDefaultsWithJobData,
  mergeInputDefaultsWithJobData,
  getOnDemandEnvVariables,
} from '../utils';

export const AppsSubmissionForm: React.FC = () => {
  const { appId, appVersion, jobUUID } = useGetAppParams();
  const { data: app } = useGetAppsSuspense({ appId, appVersion });
  const { data: allAllocations } = useGetAllocationsSuspense();

  const {
    data: { executionSystems, storageSystems, defaultStorageSystem },
  } = useGetSystems();

  const {
    user: { username },
  } = useAuthenticatedUser() as { user: TUser };
  const { data: jobData } = useGetJobSuspense('select', { uuid: jobUUID }) as {
    data: TTapisJob;
  };

  const [, setInteractiveModalDetails] =
    useInteractiveModalContext() as TInteractiveModalContext;

  const { definition, license, defaultSystemNeedsKeys } = app;

  const defaultStorageHost = defaultStorageSystem.host;
  const hasCorral = ['data.tacc.utexas.edu', 'corral.tacc.utexas.edu'].some(
    (s) => defaultStorageHost?.endsWith(s)
  );

  const noStorageAllocationRequired =
    defaultStorageSystem.notes?.noAllocationRequired;

  // Check if user has default allocation if defaultStorageHost is not corral
  const hasDefaultStorageAllocation =
    hasCorral ||
    noStorageAllocationRequired ||
    allAllocations.hosts[defaultStorageHost];

  const hasStorageSystems = !!storageSystems.length;
  const [appExecSystems, setAppExecSystems] =
    useState<TTapisSystem[]>(executionSystems);
  const [filteredExecSystems, setFilteredExecSystems] = useState<
    TTapisSystem[]
  >([]);
  const [defaultExecSystem, setDefaultExecSystem] =
    useState<TTapisSystem | null>(
      appExecSystems && appExecSystems.length > 0 ? appExecSystems[0] : null
    );

  const allocationToExecSysMap = buildMapOfAllocationsToExecSystems(
    appExecSystems,
    allAllocations
  );

  // Update available exec systems for app based on app's dynamicExecSystems filter
  useEffect(() => {
    const computedExecSystems = getExecSystemsFromApp(
      definition,
      executionSystems as TTapisSystem[]
    );
    const computedDefaultExecSystem = getDefaultExecSystem(
      definition,
      computedExecSystems
    ) as TTapisSystem;
    if (!areArraysEqual(appExecSystems, computedExecSystems)) {
      setAppExecSystems(computedExecSystems);
      setFilteredExecSystems(computedExecSystems);
      setDefaultExecSystem(computedDefaultExecSystem);
    }
  }, [definition, executionSystems]);

  const [allocations, setAllocations] = useState<string[]>(
    getAllocationList(
      definition,
      appExecSystems,
      allAllocations,
      allocationToExecSysMap
    )
  );
  const [portalAlloc, setPortalAlloc] = useState<string | undefined>(undefined);
  const [noExecAllocationRequired, setNoExecAllocationRequired] =
    useState<boolean>(true);

  // adjust the allocation list based on what exec systemss
  // are in the app definition and the host list.
  useEffect(() => {
    const newAllocations = getAllocationList(
      definition,
      appExecSystems,
      allAllocations,
      allocationToExecSysMap
    );
    setAllocations(newAllocations);

    const foundPortalAlloc = newAllocations.find((a) => a.startsWith('DS-HPC'));
    if (foundPortalAlloc) {
      setPortalAlloc(foundPortalAlloc);
      if (!getValues('configuration.allocation')) {
        setValue('configuration.allocation', foundPortalAlloc);
      }
    }
  }, [appExecSystems]);

  const { fileInputs, parameterSet, configuration, outputs } = useMemo(() => {
    return FormSchema(
      definition,
      executionSystems,
      allocations,
      defaultStorageSystem,
      username,
      portalAlloc
    );
  }, [
    definition,
    executionSystems,
    allocations,
    defaultStorageSystem,
    username,
    portalAlloc,
  ]);

  // TODOv3: dynamic exec system and queues
  const initialValues: TFormValues = useMemo(
    () => ({
      inputs: mergeInputDefaultsWithJobData(
        appId,
        appVersion,
        fileInputs.defaults,
        jobData
      ),
      parameters: mergeParameterSetDefaultsWithJobData(
        appId,
        appVersion,
        parameterSet.defaults,
        jobData
      ),
      configuration: mergeConfigurationDefaultsWithJobData(
        appId,
        appVersion,
        configuration.defaults,
        jobData
      ),
      outputs: outputs.defaults,
    }),
    [definition, jobData]
  );

  const [missingAllocation, setMissingAllocation] = useState<
    string | undefined
  >(undefined);
  useEffect(() => {
    if (!hasDefaultStorageAllocation && hasStorageSystems) {
      // User does not have default storage allocation
      setMissingAllocation(getSystemName(defaultStorageHost));
    } else if (
      isAppTypeBATCH(definition) &&
      !allocations.length &&
      !noExecAllocationRequired
    ) {
      // User does not have allocation on execution system for a batch type app
      setMissingAllocation(getSystemName(defaultExecSystem?.host ?? ''));
    } else {
      setMissingAllocation(undefined);
    }
  }, [allocations]);

  const [schema, setSchema] = useState<TAppFieldSchema>({
    inputs: z.object(fileInputs.schema),
    parameters: z.object(parameterSet.schema),
    configuration: z.object(configuration.schema),
    outputs: z.object(outputs.schema),
  });

  const { Content } = Layout;

  const missingLicense = license.type && !license.enabled;

  const methods = useForm({
    defaultValues: initialValues,
    resolver: zodResolver(z.object(schema)),
    mode: 'onChange',
  });
  const { handleSubmit, reset, setValue, getValues, watch } = methods;

  // Define type to support calls like method.trigger, which
  // require literals instead of string or string[]
  const fieldValues = getValues();
  type FieldNameUnion = keyof typeof fieldValues;

  const getSteps = (): TStep => {
    const formSteps: TStep = {};

    if (configuration.fields && Object.keys(configuration.fields).length) {
      formSteps.configuration = getConfigurationStep(configuration.fields);
    }
    if (!definition.notes.isInteractive) {
      formSteps.outputs = getOutputsStep(outputs.fields);
    }
    if (fileInputs.fields && Object.keys(fileInputs.fields).length) {
      formSteps.inputs = getInputsStep(fileInputs.fields);
    }
    if (parameterSet.fields && Object.keys(parameterSet.fields).length) {
      formSteps.parameters = getParametersStep(parameterSet.fields);
    }
    // Setup prev and next steps based on what is available.
    const formStepKeys = Object.keys(formSteps);
    const availableStepKeys = stepKeys.filter((key) =>
      formStepKeys.includes(key)
    );
    availableStepKeys.forEach((key, index) => {
      if (index > 0 && formSteps[availableStepKeys[index - 1]]) {
        formSteps[key].prevPage = availableStepKeys[index - 1];
      }
      if (
        index < stepKeys.length - 1 &&
        formSteps[availableStepKeys[index + 1]]
      ) {
        formSteps[key].nextPage = availableStepKeys[index + 1];
      }
    });

    return formSteps;
  };

  const [fields, setFields] = useState<{
    [dynamic: string]: {
      [dynamic: string]: TField | { [dynamic: string]: TField };
    };
  }>({
    inputs: fileInputs.fields,
    parameters: parameterSet.fields,
    configuration: configuration.fields,
    outputs: outputs.fields,
  });

  const initialSteps = useMemo(() => {
    const steps = getSteps();
    return Object.keys(steps).length > 0 ? steps : {};
  }, [
    fileInputs.fields,
    parameterSet.fields,
    configuration.fields,
    outputs.fields,
    fields,
    getSteps,
  ]);

  const getInitialCurrentStep = (steps: TStep) => {
    if (steps.inputs) return 'inputs';
    if (steps.parameters) return 'parameters';
    return 'configuration';
  };
  const [steps, setSteps] = useState<TStep>(initialSteps);
  const [current, setCurrent] = useState(getInitialCurrentStep(initialSteps));

  useEffect(() => {
    reset(initialValues);
    const newSteps = getSteps();
    setSteps(newSteps);
    setCurrent(getInitialCurrentStep(newSteps));
  }, [initialValues, reset]);

  function getExecSystemsForAllocation(
    definition: TTapisApp,
    allocation: string | undefined
  ) {
    if (!definition.notes?.dynamicExecSystems) {
      return {
        allocationExecSystems: undefined,
        defaultExecSystemId: definition.jobAttributes.execSystemId,
      };
    }

    const allocationExecSystemIds =
      allocationToExecSysMap.get(allocation || '') || [];
    const defaultExecSystemId = allocationExecSystemIds.includes(
      definition.jobAttributes.execSystemId
    )
      ? definition.jobAttributes.execSystemId
      : allocationExecSystemIds[0];

    const allocationExecSystems = allocationExecSystemIds.map((e) =>
      appExecSystems.find((es) => es.id === e)
    );
    return { allocationExecSystems, defaultExecSystemId };
  }

  // Dependency handler.
  const [queueValue, allocationValue, execSystemValue] = watch([
    'configuration.execSystemLogicalQueue',
    'configuration.allocation',
    'configuration.execSystemId',
  ]);

  const previousValues = useRef({
    queueValue,
    allocationValue,
    execSystemValue,
  });

  useEffect(() => {
    const {
      queueValue: prevQueueValue,
      allocationValue: prevAllocationValue,
      execSystemValue: prevExecSystemValue,
    } = previousValues.current;

    let updatedExecSystemId = execSystemValue;
    let updatedExecSystems = appExecSystems;

    // Allocation change handler
    if (prevAllocationValue !== allocationValue) {
      const { allocationExecSystems, defaultExecSystemId } =
        getExecSystemsForAllocation(definition, allocationValue);

      if (allocationExecSystems) {
        updatedExecSystemId = defaultExecSystemId;
        updatedExecSystems = (allocationExecSystems ?? []).filter(
          (sys): sys is TTapisSystem => sys !== undefined
        );

        setValue('configuration.execSystemId', defaultExecSystemId || '');
        if (!areArraysEqual(filteredExecSystems, updatedExecSystems)) {
          setFilteredExecSystems(updatedExecSystems);
        }
      }
    }
    // ExecSystem change handler
    if (
      prevExecSystemValue !== updatedExecSystemId ||
      prevAllocationValue !== allocationValue
    ) {
      const execSystem = getExecSystemFromId(
        updatedExecSystems,
        updatedExecSystemId ?? ''
      );

      if (execSystem) {
        const newQueue = getQueueValueForExecSystem({
          exec_sys: execSystem,
          queue_name: execSystem.batchDefaultLogicalQueue,
        });

        if (newQueue?.name !== queueValue) {
          setValue('configuration.execSystemLogicalQueue', newQueue?.name);
        }

        updateValuesForQueue(
          updatedExecSystems,
          updatedExecSystemId ?? definition.jobAttributes.execSystemId,
          fieldValues,
          setValue
        );
      }
    }

    // Queue change handler
    if (prevQueueValue !== queueValue) {
      updateValuesForQueue(
        updatedExecSystems,
        execSystemValue ?? definition.jobAttributes.execSystemId,
        fieldValues,
        setValue
      );
    }

    // Update ref values
    previousValues.current = { queueValue, allocationValue, execSystemValue };
  }, [queueValue, allocationValue, execSystemValue]);

  // Update schema and fields based on new exec system or queue
  useEffect(() => {
    const currentExecSystem = getExecSystemFromId(
      filteredExecSystems,
      execSystemValue ?? definition.jobAttributes.execSystemId
    );

    if (currentExecSystem) {
      setNoExecAllocationRequired(
        !!currentExecSystem.notes?.noAllocationRequired
      );

      const defaultQueue = getQueueValueForExecSystem({
        exec_sys: currentExecSystem,
        queue_name: queueValue,
      });

      if (defaultQueue) {
        // Update schema based on new allocation or execution system
        const updatedSchema = getConfigurationSchema(
          definition,
          allocations,
          filteredExecSystems,
          currentExecSystem,
          defaultQueue
        );

        setSchema((prevSchema) =>
          JSON.stringify(prevSchema.configuration) !==
          JSON.stringify(updatedSchema)
            ? { ...prevSchema, configuration: z.object(updatedSchema) }
            : prevSchema
        );

        // Update form fields based on new allocation or execution system
        const updatedFields = getConfigurationFields(
          definition,
          allocations,
          filteredExecSystems,
          currentExecSystem,
          defaultQueue
        );

        setFields((prevFields) =>
          JSON.stringify(prevFields.configuration) !==
          JSON.stringify(updatedFields)
            ? { ...prevFields, configuration: updatedFields }
            : prevFields
        );
      }
    }
  }, [
    allocations,
    execSystemValue,
    queueValue,
    definition,
    filteredExecSystems,
  ]);

  // TODO: DES-2916: Use Zod's superRefine feature instead of manually updating schema and tracking schema changes.
  useEffect(() => {
    // Note: trigger is a no op if the field does not exist. So, it is fine to define all.
    methods.trigger([
      'configuration.allocation',
      'configuration.execSystemId',
      'configuration.nodeCount',
      'configuration.maxMinutes',
      'configuration.coresPerNode',
    ]);
  }, [schema, methods]);

  interface TStep {
    [dynamic: string]: {
      title: string;
      nextPage?: string;
      prevPage?: string;
      content: JSX.Element;
    };
  }

  // Note: currently configuration is the only
  // step that needs update. This can be more generic
  // in future if the fields shape is same between
  // Step and Submission Detail View (mostly related to env vars)
  useEffect(() => {
    if (configuration.fields && Object.keys(configuration.fields).length) {
      const updatedConfigurationStep = getConfigurationStep(
        fields.configuration as { [key: string]: TField }
      );

      const updatedSteps: TStep = {
        ...steps,
        configuration: {
          ...steps.configuration,
          ...updatedConfigurationStep,
        },
      };

      setSteps(updatedSteps);
    }
  }, [fields]);

  // next step transition does not block on invalid fields
  const handleNextStep = useCallback(async () => {
    const stepFields = Object.keys(fieldValues).filter((key) =>
      key.startsWith(current)
    ) as FieldNameUnion[];
    await methods.trigger(stepFields);
    const nextPage = steps[current].nextPage;
    nextPage && setCurrent(nextPage);
  }, [current, methods]);
  const handlePreviousStep = useCallback(() => {
    const prevPage = steps[current].prevPage;
    prevPage && setCurrent(prevPage);
  }, [current]);
  const {
    mutate: submitJob,
    isPending,
    isSuccess,
    data: submitResult,
    error: submitError,
    variables: submitVariables,
  } = usePostJobs();

  const [pushKeysSystem, setPushKeysSystem] = useState<
    TTapisSystem | undefined
  >();

  const readOnly =
    !!missingLicense ||
    !hasStorageSystems ||
    (definition.jobType === 'BATCH' && !!missingAllocation) ||
    !!defaultSystemNeedsKeys ||
    isPending;

  useEffect(() => {
    if (submitResult?.execSys) {
      setPushKeysSystem(
        pushKeysSystem?.defaultAuthnMethod === 'TMS_KEYS'
          ? undefined
          : submitResult.execSys
      );
    } else if (isSuccess) {
      reset(initialValues);
      if (definition.notes.isInteractive) {
        setInteractiveModalDetails({
          show: true,
          openedBySubmit: true,
          uuid: submitResult.uuid,
        });
      }
    }
  }, [submitResult]);

  const submitJobCallback = (submitData: TFormValues) => {
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
                const field = parameterSet.fields?.[sParameterSet]?.[k];
                // filter read only parameters. 'FIXED' parameters are tracked as readOnly
                if (field?.readOnly) return;
                // Convert the value to a string, if necessary
                const transformedValue =
                  typeof v === 'number' ? v.toString() : v;
                return sParameterSet === 'envVariables'
                  ? { key: field?.key ?? k, value: transformedValue }
                  : { name: field?.key ?? k, arg: transformedValue };
              })
              .filter((v) => v), // filter out any empty values
          };
        }
      )
    );
    if (jobData.job.parameterSet['envVariables']) {
      jobData.job.parameterSet['envVariables'] = jobData.job.parameterSet[
        'envVariables'
      ].concat(getOnDemandEnvVariables(definition));
    } else {
      jobData.job.parameterSet['envVariables'] =
        getOnDemandEnvVariables(definition);
    }

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

    const schedOpts = definition.jobAttributes.parameterSet?.schedulerOptions;
    if (schedOpts) {
      schedOpts.forEach((opt) => {
        if (opt.notes?.isReservation) {
          const reservation = jobData.job.parameterSet.schedulerOptions.find(
            (option) => option.name === 'TACC Reservation'
          );
          if (reservation) {
            reservation.arg = `--reservation=${reservation.arg}`;
          }
        }
      });
    }

    // Before job submission, ensure the memory limit is not above queue limit.
    if (definition.jobType === 'BATCH') {
      const queue = getExecSystemFromId(
        executionSystems,
        jobData.job.execSystemId ?? definition.jobAttributes.execSystemId
      )?.batchLogicalQueues.find(
        (q) => q.name === jobData.job.execSystemLogicalQueue
      );
      if (queue && app.definition.jobAttributes.memoryMB > queue.maxMemoryMB) {
        jobData.job.memoryMB = queue.maxMemoryMB;
      }
    }

    submitJob(jobData);
  };

  const defaultSystemNeedsKeysMessage =
    defaultStorageSystem.defaultAuthnMethod === 'TMS_Keys' ? (
      <span>
        For help,{' '}
        <a
          rel="noopener noreferrer"
          target="_blank"
          className="wb-link"
          href="https://www.designsafe-ci.org/help/submit-ticket/"
        >
          submit a ticket.
        </a>
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
      {submitResult &&
        !submitResult.execSys &&
        !definition.notes.isInteractive && (
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
            style={{ marginBottom: '1rem' }}
          />
        )}
      {submitResult &&
        submitResult.execSys &&
        submitResult.execSys?.defaultAuthnMethod === 'TMS_Keys' && (
          <Alert
            message={
              <>
                There was a problem with file system access. Please submit a{' '}
                <a href="/help/new-ticket/" target="_blank">
                  ticket.
                </a>
              </>
            }
            type="warning"
            showIcon
            style={{ marginBottom: '1rem' }}
          />
        )}
      {missingAllocation && (
        <Alert
          message={
            <>
              Please submit a{' '}
              <a href="/help/new-ticket/" target="_blank">
                ticket
              </a>{' '}
              to request an allocation of computing time to run this
              application.
            </>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '1rem' }}
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
          style={{ marginBottom: '1rem' }}
        />
      )}
      {defaultSystemNeedsKeys && (
        <Alert
          message={
            <>
              There was a problem accessing your default My Data file system.{' '}
              {defaultSystemNeedsKeysMessage}
            </>
          }
          type="warning"
          closable
          showIcon
          style={{ marginBottom: '1rem' }}
        />
      )}
      {!!(missingLicense && hasStorageSystems) && (
        <div className="appDetail-error">
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: '1rem' }}
            message={
              <>
                Activate your {app.license.type} license in{' '}
                <Button type="link" href="/account/licenses/" target="_blank">
                  Manage Account
                </Button>
                , then return to this form.
              </>
            }
          />
        </div>
      )}
      <Content>
        <FormProvider {...methods}>
          <Form
            disabled={readOnly}
            requiredMark={false}
            layout="vertical"
            onFinish={handleSubmit(submitJobCallback, (error) => {
              console.log('error submit data', error);
            })}
          >
            <fieldset disabled={readOnly}>
              <Row gutter={[64, 16]} align="top">
                {Object.keys(steps || {}).length === 0 ? (
                  <Col style={{ marginTop: '32px', marginLeft: '32px' }}>
                    <Space direction="vertical" size="large">
                      <div>
                        {isSuccess ? (
                          <span>
                            Session has been launched. You can view status in{' '}
                            <strong>Job Status</strong>.
                          </span>
                        ) : (
                          definition.notes.jobLaunchDescription ??
                          'This job is pre-configured. No input is necessary to submit the job.'
                        )}
                      </div>
                      <div>
                        <JobSubmitButton
                          loading={isPending}
                          interactive={definition.notes.isInteractive}
                          disabled={isPending || isSuccess}
                          success={isSuccess}
                        />
                      </div>
                    </Space>
                  </Col>
                ) : (
                  <>
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
                        current={current}
                        setCurrent={setCurrent}
                        definition={definition}
                      />
                    </Col>
                  </>
                )}
              </Row>
            </fieldset>
          </Form>
        </FormProvider>
      </Content>
      <SystemsPushKeysModal
        isModalOpen={pushKeysSystem}
        setIsModalOpen={setPushKeysSystem}
        onSuccess={() => submitVariables && submitJob(submitVariables)}
      />
    </>
  );
};
