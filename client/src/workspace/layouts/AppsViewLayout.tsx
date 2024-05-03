import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { Spinner } from '@client/common-components';
import { AppsSubmissionForm } from '@client/workspace';

export const AppsViewLayout: React.FC = () => {
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
          {/* <AppsSubmissionForm formValues={formValues} /> */}
        </Layout.Sider>
      </Layout>
    </Form>
  );
};
