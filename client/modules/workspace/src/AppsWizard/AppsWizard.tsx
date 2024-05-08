import React from 'react';
import { Button, Layout, Flex } from 'antd';
import { useFormContext, SubmitHandler, FieldValues } from 'react-hook-form';
// import styles from './AppsWizard.module.css';

// import React, { createContext, useContext, useState } from 'react';

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
//       setValues(updateValuesForQueue(execSystems, values));
//     }
//     setPreviousValues(values);
//   }, [app, values, setValues]);
//   return null;
// };

export const AppsWizard: React.FC<{
  step: {
    title: string;
    prevPage?: string;
    nextPage?: string;
    content: JSX.Element;
  };
  handlePreviousStep: SubmitHandler<FieldValues>;
  handleNextStep: SubmitHandler<FieldValues>;
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
    textAlign: 'center' as const,
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
