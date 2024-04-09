import { AppsWizard, AppsSubmissionForm } from '@client/workspace';
import { TAppParamsType, TAppResponse } from '@client/hooks';
import { Layout, Form, message } from 'antd';
import React, { useState } from 'react';
import styles from './layout.module.css';
import { useParams, useLocation } from 'react-router-dom';
import { useGetApps } from '@client/hooks';
import { Spinner } from '@client/common-components';

export const AppsViewLayout: React.FC = () => {
  const { appId } = useParams() as TAppParamsType;
  const location = useLocation();

  const appVersion = new URLSearchParams(location.search).get('appVersion') as
    | string
    | undefined;

  const { data, isLoading } = useGetApps({ appId, appVersion }) as {
    data: TAppResponse;
    isLoading: boolean;
  };
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

  if (isLoading) return <Spinner />;

  return (
    <Form
      name="rootForm"
      onFinish={onFinish}
      onValuesChange={onValuesChange}
      onFinishFailed={onValidationError}
    >
      <Layout style={{ gap: '5px', minWidth: '500px' }}>
        <Layout.Content className={styles['listing-main']}>
          <AppsWizard data={data} />
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
