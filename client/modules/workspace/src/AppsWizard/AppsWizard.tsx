import React from 'react';
import { Layout, Flex } from 'antd';
import { SubmitHandler, FieldValues } from 'react-hook-form';
import { SecondaryButton } from '@client/common-components';

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
              <SecondaryButton
                style={{
                  margin: '0 8px',
                }}
                disabled={!step.prevPage}
                onClick={handlePreviousStep}
              >
                Back
              </SecondaryButton>
              <SecondaryButton
                style={{
                  margin: '0 8px',
                }}
                disabled={!step.nextPage}
                onClick={handleNextStep}
              >
                Continue
              </SecondaryButton>
            </span>
          </Flex>
        </Header>
        <Content style={contentStyle}>{step.content}</Content>
      </Layout>
    </Flex>
  );
};
