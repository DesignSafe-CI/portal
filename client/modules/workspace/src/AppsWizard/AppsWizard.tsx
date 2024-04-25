import React, { useState } from 'react';
import { Button, Form, Input, Row, Layout, Flex, Select } from 'antd';
import { FormItem } from 'react-hook-form-antd';

// import { createContext, useContext } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
// import styles from './AppsWizard.module.css';

// export const AppFormStateContext = createContext({});

// export function AppFormProvider({ children, initialState = {} }) {
//   const value = useState(initialState);
//   return (
//     <AppFormStateContext.Provider value={value}>
//       {children}
//     </AppFormStateContext.Provider>
//   );
// }

// export function useAppFormState() {
//   const context = useContext(AppFormStateContext);
//   if (!context) {
//     throw new Error('useAppFormState must be used within the AppFormProvider');
//   }
//   return context;
// }

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

export function FormField({
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
  const fieldState = useWatch({ control, name });
  const { resetField } = useFormContext(); // retrieve those props
  return (
    <div style={{ lineHeight: '20px' }}>
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
      <FormItem
        control={control}
        name={name}
        required={required}
        label={label}
        htmlFor={name}
      >
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
                onClick={() => resetField(name, { defaultValue: '' })}
                disabled={!fieldState}
              >
                Clear
              </Button>
            }
          />
        )}
      </FormItem>
      <small style={{ lineHeight: '20px' }}>{description}</small>
    </div>
  );
}

export const AppsWizard: React.FC<{
  step: object;
  handlePreviousStep: CallableFunction;
  handleNextStep: CallableFunction;
}> = ({ step, handlePreviousStep, handleNextStep }) => {
  const { handleSubmit } = useFormContext();

  const contentStyle = {
    lineHeight: '260px',
    textAlign: 'center' as const,
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
  return (
    <Flex gap="middle" wrap="wrap">
      <Layout style={layoutStyle}>
        <Header style={headerStyle}>
          <Flex justify="space-between">
            <span>{step.title}</span>
            <span>
              <Button
                style={{
                  margin: '0 8px',
                }}
                disabled={!step.prevPage}
                onClick={handleSubmit(handlePreviousStep, (data) => {
                  console.log('error prev data', data);
                })}
              >
                Back
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                disabled={!step.nextPage}
                onClick={handleSubmit(handleNextStep, (data) => {
                  console.log('error next data', data);
                })}
              >
                Continue
              </Button>
            </span>
          </Flex>
        </Header>
        <Content style={contentStyle}>{step.content}</Content>
      </Layout>
    </Flex>
  );
};
