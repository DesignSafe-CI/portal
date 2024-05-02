import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { Spinner } from '@client/common-components';
import { AppsSubmissionForm } from '@client/workspace';

export const AppsViewLayout: React.FC = () => {
  return (
    <>
      <Suspense
        fallback={
          <Layout>
            <Spinner />
          </Layout>
        }
      >
        {/* <AppFormProvider> */}
        <AppsSubmissionForm />
        {/* </AppFormProvider> */}
      </Suspense>
      <Outlet />
    </>
  );
};
