import { AppsWizard, AppsSubmissionForm } from '@client/workspace';
import { TAppParamsType } from '@client/hooks';
import { Layout, Form, List, message } from 'antd';
import React, { useState } from 'react';
import styles from './layout.module.css';
import { useParams } from 'react-router-dom';

export const AppsViewLayout: React.FC = () => {
  const { appId, appVersion } = useParams() as TAppParamsType;
  const [formValues, setFormValues] = useState({
    steptest1: undefined,
    steptest2: undefined,
  });
  const onFinish = () => message.success('Form validated');
  const onValuesChange = (_, allValues) => {
    setFormValues(allValues);
  };

  const onValidationError = ({ errorFields }) => {
    errorFields
      .map((errField) => errField.errors)
      .forEach((error) => {
        message.error({ content: error, style: { marginTop: 20 } });
      });
  };

  return (
    <Form
      name="rootForm"
      onFinish={onFinish}
      onValuesChange={onValuesChange}
      onFinishFailed={onValidationError}
    >
      <Layout style={{ gap: '5px', minWidth: '500px' }}>
        <Layout.Content className={styles['listing-main']}>
          <AppsWizard appId={appId} appVersion={appVersion} />
        </Layout.Content>
        <Layout.Sider
          width="250"
          style={{
            backgroundColor: 'transparent',
            paddingLeft: '1em',
            paddingTop: '3em',
          }}
        >
          <AppsSubmissionForm formValues={formValues} />
        </Layout.Sider>
      </Layout>
    </Form>
  );
};
