import React, { useState } from 'react';
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
import { useForm, useField, Field } from '@tanstack/react-form';
import type { FieldApi } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
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
} from './AppsFormUtils';
import FormSchema from './AppsFormSchema';

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
function FieldInfo({
  description,
  field,
}: {
  description: string;
  field: FieldApi<any, any, any, any>;
}) {
  return (
    <>
      <small className="form-field__help">
        {description}
        {field.state.meta.touchedErrors && (
          <div className="form-field__validation-error">
            {field.state.meta.touchedErrors}
          </div>
        )}
      </small>
    </>
  );
}

function FormField({
  addon,
  addonType,
  label,
  description,
  required,
  tapisFile,
  SelectModal,
  name,
  type,
  placeholder,
  validators,
  parameterSet,
  Field,
  options,
  ...props
}) {
  // console.log(name);
  return (
    <Field
      name={name}
      validators={{
        onChange: validators,
        // onChange: (e) => console.log(e),
      }}
      children={(field) => {
        console.log(field);
        // console.log(field.name);
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
                  <Select
                    options={options}
                    id={field.name}
                    // name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e)}
                    placeholder={placeholder}
                    {...props}
                  />
                ) : (
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
  appFormSchema: {};
  values: {};
  Field: {};
  form;
}> = ({ app, appFormSchema, values, Field, formValues, form }) => {
  const allocations = ['A', 'B'];
  console.log(values);
  // values = formValues;
  // form.state.values = formValues;
  console.log(formValues);
  console.log(form.state.values);
  // console.log(Field);

  const queue = app.exec_sys.batchLogicalQueues.find(
    (q) => q.name === values.configuration?.execSystemLogicalQueue
  );
  console.log(queue);
  const steps = [
    {
      title: 'Inputs',
      content: (
        <>
          {Object.entries(appFormSchema.fileInputs.fields).map(
            ([name, field]) => {
              const validators = appFormSchema.fileInputs.schema[name];
              // TODOv3 handle fileInputArrays https://jira.tacc.utexas.edu/browse/WP-81
              return isTargetPathField(name) ? (
                <FormField
                  Field={form.Field}
                  {...field}
                  validators={validators}
                  name={`inputs.${name}`}
                  placeholder="Target Path Name"
                  key={`fileInputs.${name}`}
                />
              ) : (
                <FormField
                  Field={form.Field}
                  {...field}
                  validators={validators}
                  name={`inputs.${name}`}
                  tapisFile
                  // SelectModal={DataFilesSelectModal}
                  placeholder="Browse Data Files"
                  key={`fileInputs.${name}`}
                />
              );
            }
          )}
          <form.Field
            name={'inputs.test'}
            validators={{
              onChange: z.string(),
            }}
            children={(field) => {
              return (
                <>
                  <label htmlFor={field.name}>Last Name:</label>
                  <input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </>
              );
            }}
          />
        </>
      ),
    },
    {
      title: 'Parameters',
      content: (
        <>
          {Object.entries(appFormSchema.parameterSet.fields).map(
            ([parameterSet, parameterValue]) => {
              return Object.entries(parameterValue).map(([name, field]) => {
                const validators =
                  appFormSchema.parameterSet.schema[parameterSet][
                    parameterValue
                  ];
                return (
                  <FormField
                    Field={form.Field}
                    {...field}
                    validators={validators}
                    name={`parameters.${parameterSet}.${name}`}
                    key={`parameterSet.${parameterSet}.${name}`}
                    options={field.options}
                  />
                );
              });
            }
          )}
        </>
      ),
    },
    {
      title: 'Configuration',
      content: (
        <>
          {app.definition.jobType === 'BATCH' && (
            <FormField
              Field={form.Field}
              label="Queue"
              name="configuration.execSystemLogicalQueue"
              description="Select the queue this job will execute on."
              type="select"
              required
              validators={z.enum(
                app.exec_sys.batchLogicalQueues.map((q) => q.name)
              )}
              options={app.exec_sys.batchLogicalQueues
                // Hide queues for which the app default nodeCount does not meet the minimum or maximum requirements
                // while hideNodeCountAndCoresPerNode is true
                .filter(
                  (q) =>
                    !app.definition.notes.hideNodeCountAndCoresPerNode ||
                    (app.definition.jobAttributes.nodeCount >= q.minNodeCount &&
                      app.definition.jobAttributes.nodeCount <= q.maxNodeCount)
                )
                // Hide queues for if app includes a queueFilter and queue is not present in queueFilter
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
            Field={form.Field}
            label="Maximum Job Runtime (minutes)"
            // description={`The maximum number of minutes you expect this job to run for. Maximum possible is ${getQueueMaxMinutes(
            //   app,
            //   state.values.execSystemLogicalQueue
            // )} minutes. After this amount of time your job will end. Shorter run times result in shorter queue wait times.`}
            name="configuration.maxMinutes"
            type="number"
            required
            validators={queue && getMaxMinutesValidation(queue)}
          />
          {!app.definition.notes.hideNodeCountAndCoresPerNode ? (
            <>
              <FormField
                Field={form.Field}
                label="Cores Per Node"
                description="Number of processors (cores) per node for the job. e.g. a selection of 16 processors per node along with 4 nodes will result in 16 processors on 4 nodes, with 64 processors total."
                name="configuration.coresPerNode"
                type="number"
                validators={
                  queue && getCoresPerNodeValidation(queue).optional()
                }
              />
              <FormField
                Field={form.Field}
                label="Node Count"
                description="Number of requested process nodes for the job."
                name="configuration.nodeCount"
                type="number"
                validators={queue && getNodeCountValidation(queue).optional()}
              />
            </>
          ) : null}
          {app.definition.jobType === 'BATCH' && (
            <FormField
              Field={form.Field}
              label="Allocation"
              name="configuration.allocation"
              description="Select the project allocation you would like to use with this job submission."
              type="select"
              required
              options={[
                { label: '', hidden: true, disabled: true },
                ...allocations
                  .sort()
                  .map((projectId) => ({ value: projectId, label: projectId })),
              ]}
              validators={z.enum(
                allocations,
                'Please select an allocation from the dropdown.'
              )}
            />
          )}
        </>
      ),
    },
    {
      title: 'Outputs',
      content: (
        <>
          <FormField
            Field={form.Field}
            label="Job Name"
            description="A recognizable name for this job."
            name="name"
            type="text"
            required
            validators={z.string().max(64, 'Must be 64 characters or less')}
          />
          <FormField
            Field={form.Field}
            label="Job Name"
            description="A recognizable name for this job."
            name="outputs.name"
            type="text"
            required
            validators={z.string().max(64, 'Must be 64 characters or less')}
          />
          <FormField
            Field={form.Field}
            label="Job Name"
            description="A recognizable name for this job."
            name="outputs.name"
            type="text"
            required
            validators={z.string().max(64, 'Must be 64 characters or less')}
          />
          <FormField
            Field={form.Field}
            label="Job Name"
            description="A recognizable name for this job."
            name="outputs.name"
            type="text"
            required
            validators={z.string().max(64, 'Must be 64 characters or less')}
          />
          <FormField
            Field={form.Field}
            label="Job Name"
            description="A recognizable name for this job."
            name="testsss"
            type="text"
            required
            validators={z.string().max(64, 'Must be 64 characters or less')}
          />
          {!app.definition.notes.isInteractive && (
            <>
              <FormField
                Field={form.Field}
                label="Archive System"
                description="System into which output files are archived after application execution."
                name="outputs.archiveSystemId"
                type="text"
                validators={z.string().optional()}
                placeholder={app.definition.jobAttributes.archiveSystemId} // || defaultSystem}
              />
              <FormField
                Field={form.Field}
                label="Archive Directory"
                description="Directory into which output files are archived after application execution."
                name="outputs.archiveSystemDir"
                type="text"
                validators={z.string().optional()}
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
  ];

  const { token } = theme.useToken();
  const [current, setCurrent] = useState(0);
  const next = () => {
    setCurrent(current + 1);
  };
  const prev = () => {
    setCurrent(current - 1);
  };

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

  return (
    app && (
      <>
        <Flex gap="middle" wrap="wrap">
          <Layout style={layoutStyle}>
            <Header style={headerStyle}>
              <Flex justify="space-between">
                <span>{steps[current].title}</span>
                <span>
                  <Button
                    style={{
                      margin: '0 8px',
                    }}
                    onClick={() => prev()}
                    disabled={!(current > 0)}
                  >
                    Back
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => next()}
                    disabled={!(current < steps.length - 1)}
                  >
                    Continue
                  </Button>
                </span>
              </Flex>
            </Header>
            <Content style={contentStyle}>{steps[current].content}</Content>
          </Layout>
        </Flex>
        {/* <div
          style={{
            marginTop: 24,
          }}
        >
          <Button
            style={{
              margin: '0 8px',
            }}
            onClick={() => prev()}
            disabled={!(current > 0)}
          >
            Back
          </Button>
          <Button
            type="primary"
            onClick={() => next()}
            disabled={!(current < steps.length - 1)}
          >
            Continue
          </Button>
        </div>
        <div style={contentStyle}>{steps[current].content}</div>
        <div>{app.definition.notes.label || app.definition.id}</div> */}
      </>
    )
  );
};
