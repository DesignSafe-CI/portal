import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  forwardRef,
  useRef,
} from 'react';
// import styles from './AppsWizard.module.css';
import {
  Button,
  Form,
  Input,
  theme,
  Row,
  Col,
  Layout,
  Flex,
  Select,
} from 'antd';
import { TAppResponse } from '@client/hooks';
// import { useForm, useField, Field } from '@tanstack/react-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormItem } from 'react-hook-form-antd';
// import type { FieldApi } from '@tanstack/react-form';
// import { zodValidator } from '@tanstack/zod-form-adapter';
import { number, z } from 'zod';
import {
  isTargetPathEmpty,
  isTargetPathField,
  getInputFieldFromTargetPathField,
  getQueueMaxMinutes,
  getMaxMinutesValidation,
  getNodeCountValidation,
  getCoresPerNodeValidation,
  getTargetPathFieldName,
  updateValuesForQueue,
  getAppQueueValues,
} from '@client/workspace';
import FormSchema from './AppsFormSchema';

import { createContext, useContext } from 'react';
import { FormProvider, useFormContext, useFormState } from 'react-hook-form';

export const AppFormStateContext = createContext({});

export function AppFormProvider({ children, initialState = {} }) {
  const value = useState(initialState);
  return (
    <AppFormStateContext.Provider value={value}>
      {children}
    </AppFormStateContext.Provider>
  );
}

export function useAppFormState() {
  const context = useContext(AppFormStateContext);
  if (!context) {
    throw new Error('useAppFormState must be used within the AppFormProvider');
  }
  return context;
}

/**
 * AdjustValuesWhenQueueChanges is a component that makes uses of
 * useFormikContext to ensure that when users switch queues, some
 * variables are updated to match the queue specifications (i.e.
 * correct node count, runtime etc)
 */
// const AdjustValuesWhenQueueChanges = ({ app }) => {
//   const [previousValues, setPreviousValues] = useState();

//   // Grab values and update if queue changes
//   const { values, setValues } = useFormikContext();
//   React.useEffect(() => {
//     if (
//       previousValues &&
//       previousValues.execSystemLogicalQueue !== values.execSystemLogicalQueue
//     ) {
//       setValues(updateValuesForQueue(app, values));
//     }
//     setPreviousValues(values);
//   }, [app, values, setValues]);
//   return null;
// };

// const FieldLabel = () => (
//   <Label
//     className="form-field__label"
//     for={id || name}
//     size="sm"
//     style={{ display: 'flex', alignItems: 'center' }}
//   >
//     {label}&nbsp;
//     {parameterSet && (
//       <code>
//         (
//         <a
//           href={`https://tapis.readthedocs.io/en/latest/technical/jobs.html#${parameterSet.toLowerCase()}`}
//           target="_blank"
//           rel="noreferrer"
//         >
//           {parameterSet}
//         </a>
//         )
//       </code>
//     )}
//     {required ? (
//       <Badge color="danger" style={{ marginLeft: '10px' }}>
//         Required
//       </Badge>
//     ) : null}
//   </Label>
// );
import { Children, cloneElement, isValidElement } from 'react';
import type { Control, FieldPath, FieldValues, Field } from 'react-hook-form';
import { useController, UseControllerProps } from 'react-hook-form';
function FieldInfo({
  description,
  name,
  control,
}: {
  description: string;
  name: string;
  control: Control;
}) {
  const { fieldState } = useController({ name, control });
  // console.log('fieldState', fieldState);
  return (
    <>
      <small className="form-field__help">
        {description}
        {fieldState.invalid && fieldState.isTouched && fieldState.error && (
          <div className="form-field__validation-error">{fieldState.error}</div>
        )}
      </small>
    </>
  );
}

function FormField({
  control,
  name,
  tapisFile = false,
  parameterSet = null,
  description,
  label,
  required,
  type,
  ...props
}) {
  console.log(props);
  return (
    <Form.Item label={label} htmlFor={name}>
      <Row>
        {parameterSet && (
          <code>
            (
            <a
              href={`https://tapis.readthedocs.io/en/latest/technical/jobs.html#${parameterSet.toLowerCase()}`}
              target="_blank"
              rel="noreferrer"
            >
              {parameterSet}
            </a>
            )
          </code>
        )}
        <FormItem control={control} name={name} required={required} noStyle>
          {/* <SelectModal
                isOpen={openTapisFileModal}
                toggle={() => {
                  setOpenTapisFileModal((prevState) => !prevState);
                }}
                onSelect={(system, path) => {
                  helpers.setValue(`tapis://${system}/${path}`);
                }}
              /> */}
          {type === 'select' ? (
            <Select {...props} />
          ) : (
            <Input
              {...props}
              type={type}
              // name={name}
              // addonBefore={
              //   tapisFile && (
              //     <Form.Item name="prefix" noStyle>
              //       <Button
              //         type="primary"
              //         // onClick={() => setOpenTapisFileModal(true)}
              //       >
              //         Select
              //       </Button>
              //     </Form.Item>
              //   )
              // }
              // addonAfter={
              //   <Button
              //     type="text"
              //     onClick={() => console.log('clear')}
              //     // disabled={!field.state.value}
              //   >
              //     Clear
              //   </Button>
              // }
            />
          )}
          {/* <FieldInfo description={description} control={control} name={name} /> */}
        </FormItem>
      </Row>
    </Form.Item>
  );
}

function FormField2({
  control,
  label,
  description,
  required,
  tapisFile,
  SelectModal,
  name,
  type,
  placeholder,
  parameterSet,
  options,
  ...props
}) {
  return (
    <Field
      name={name}
      // defaultValue={}
      validators={{
        onChange: validators,
        // onChangeAsyncDebounceMs: 500,
        // onMount: (e) => console.log(e),
        // onChange: (e) => console.log(e),
      }}
      children={(field) => {
        // console.log(field);
        return (
          <>
            <Form.Item label={label} htmlFor={field.name}>
              <Row>
                {parameterSet && (
                  <code>
                    (
                    <a
                      href={`https://tapis.readthedocs.io/en/latest/technical/jobs.html#${parameterSet.toLowerCase()}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {parameterSet}
                    </a>
                    )
                  </code>
                )}
                {/* <SelectModal
                isOpen={openTapisFileModal}
                toggle={() => {
                  setOpenTapisFileModal((prevState) => !prevState);
                }}
                onSelect={(system, path) => {
                  helpers.setValue(`tapis://${system}/${path}`);
                }}
              /> */}
                {type === 'select' ? (
                  <></>
                ) : (
                  // <Select
                  //   options={options}
                  //   id={field.name}
                  //   // name={field.name}
                  //   value={field.state.value}
                  //   onBlur={field.handleBlur}
                  //   onChange={(e) => field.handleChange(e)}
                  //   placeholder={placeholder}
                  //   {...props}
                  // />
                  <Input
                    addonBefore={
                      tapisFile && (
                        <Form.Item name="prefix" noStyle>
                          <Button
                            type="primary"
                            // onClick={() => setOpenTapisFileModal(true)}
                          >
                            Select
                          </Button>
                        </Form.Item>
                      )
                    }
                    addonAfter={
                      <Button
                        type="text"
                        onClick={() => field.setValue('')}
                        // disabled={!field.state.value}
                      >
                        Clear
                      </Button>
                    }
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    type={type}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.type === 'number'
                          ? e.target.valueAsNumber
                          : e.target.value
                      )
                    }
                    placeholder={placeholder}
                    // {...field}
                    {...props}
                  />
                )}
              </Row>
              <Row>
                <FieldInfo description={description} field={field} />
              </Row>
            </Form.Item>
          </>
        );
      }}
    />
  );
}

export const AppsWizard: React.FC<{
  app: TAppResponse;
  schema: {};
  readOnly: boolean;
  fields: any;
}> = ({ app, schema, readOnly, fields }) => {
  const [current, setCurrent] = useState('configuration');
  const [state, setState] = useAppFormState();

  const methods = useForm({
    defaultValues: { [current]: state[current] },
    resolver: zodResolver(z.object({ [current]: schema[current] })),
    mode: 'onChange',
  });
  const { handleSubmit, control } = methods;

  const allocations = ['A', 'B'];

  // const queue = app.execSystems.batchLogicalQueues.find(
  //   (q) => q.name === state.configuration?.execSystemLogicalQueue
  // );

  const steps = {
    inputs: {
      title: 'Inputs',
      nextPage: 'parameters',
      content: (
        <>
          {Object.entries(fields.fileInputs).map(([name, field]) => {
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
          {Object.entries(fields.parameterSet).map(
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
              )
                // Hide queues for which the app default nodeCount does not meet the minimum or maximum requirements
                // while hideNodeCountAndCoresPerNode is true
                .filter(
                  (q) =>
                    !app.definition.notes.hideNodeCountAndCoresPerNode ||
                    (app.definition.jobAttributes.nodeCount >= q.minNodeCount &&
                      app.definition.jobAttributes.nodeCount <= q.maxNodeCount)
                )
                // Hide queues when app includes a queueFilter and queue is not present in queueFilter
                .filter(
                  (q) =>
                    !app.definition.notes.queueFilter ||
                    app.definition.notes.queueFilter.includes(q.name)
                )
                .map((q) => ({ value: q.name, label: q.name }))
                .sort()}
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
      console.log('next changed');
      setState({ ...state, ...data });
      setCurrent(steps[current].nextPage);
    },
    [current]
  );
  const handlePreviousStep = useCallback(
    (data) => {
      // const formcontext = useFormContext();
      // const formstate = useFormState({
      //   control,
      // });
      // console.log(formcontext);
      // console.log(formstate);
      console.log('prev changed');
      setState({ ...state, ...data });
      setCurrent(steps[current].prevPage);
    },
    [current]
  );
  const contentStyle = {
    lineHeight: '260px',
    textAlign: 'center' as const,
    // color: token.colorTextTertiary,
    // backgroundColor: token.colorFillAlter,
    // borderRadius: token.borderRadiusLG,
    // border: `1px dashed ${token.colorBorder}`,
    marginTop: 16,
  };
  const headerStyle = {
    paddingLeft: 0,
    paddingRight: 0,
    textAlign: 'center',
    height: 64,
    paddingInline: 48,
    lineHeight: '64px',
    background: 'transparent',
    borderBottom: '1px solid #707070',
  };
  const layoutStyle = {
    overflow: 'hidden',
  };

  const { Header, Content } = Layout;
  // console.log(steps[current].content);

  const BackButton = forwardRef(function BackButton(props, ref) {
    const formcontext = useFormContext();
    const formstate = useFormState({
      control,
    });
    console.log(formcontext);
    console.log(formstate);
    return <Button onClick={() => console.log(ref)}>Back</Button>;
    // return <Button onClick={() => onClick(ref)}>Back</Button>
  });

  return (
    <Flex gap="middle" wrap="wrap">
      <Layout style={layoutStyle}>
        <FormProvider {...methods}>
          <Form
            disabled={readOnly}
            name={`${steps[current].title}Form`}
            layout="vertical"
            onFinish={handleSubmit(handleNextStep, (data) => {
              console.log('error data', data);
            })}
          >
            <fieldset>
              <Header style={headerStyle}>
                <Flex justify="space-between">
                  <span>{steps[current].title}</span>
                  <span>
                    <Button
                      style={{
                        margin: '0 8px',
                      }}
                      // onClick={(e) => {
                      //   handleSubmit()
                      //   e.preventDefault();
                      //   e.stopPropagation();
                      //   prev(steps[current].prevPage);
                      // }}
                      onClick={handleSubmit(handlePreviousStep, (data) => {
                        console.log('error data', data);
                      })}
                      disabled={!steps[current].prevPage}
                    >
                      Back
                    </Button>
                    {/* <BackButton /> */}
                    <Button
                      type="primary"
                      htmlType="submit"
                      // onClick={(e) => {
                      //   e.preventDefault();
                      //   e.stopPropagation();
                      //   next(steps[current].nextPage);
                      // }}
                      disabled={!steps[current].nextPage}
                    >
                      Continue
                    </Button>
                  </span>
                </Flex>
              </Header>
              <Content style={contentStyle}>{steps[current].content}</Content>
            </fieldset>
          </Form>
        </FormProvider>
      </Layout>
    </Flex>
  );
};

// export const AppsWizard: React.FC<{}> = () => {

//   return (
//     <Flex gap="middle" wrap="wrap">
//       <Layout style={layoutStyle}>
//         <Header style={headerStyle}>
//           <Flex justify="space-between">
//             <span>{steps[current].title}</span>
//             <span>
//               <Button
//                 style={{
//                   margin: '0 8px',
//                 }}
//                 onClick={() => prev()}
//                 disabled={!(current > 0)}
//               >
//                 Back
//               </Button>
//               <Button
//                 type="primary"
//                 onClick={() => next()}
//                 disabled={!(current < steps.length - 1)}
//               >
//                 Continue
//               </Button>
//             </span>
//           </Flex>
//         </Header>
//         <Content style={contentStyle}>
//           <Form
//             disabled={readOnly}
//             name={`${steps[current].title}Form`}
//             layout="vertical"
//             // onSubmit={(e) => {
//             //   console.log('submitting');
//             //   e.preventDefault();
//             //   e.stopPropagation();
//             //   void handleSubmit();
//             // }}
//           >
//             {steps[current].content}
//           </Form>
//         </Content>
//       </Layout>
//     </Flex>

//   )
// }
