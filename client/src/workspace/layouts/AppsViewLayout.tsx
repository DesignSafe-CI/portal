import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { Spinner } from '@client/common-components';
import { AppsSubmissionForm, useGetAppParams } from '@client/workspace';
import { useAppsListing } from '@client/hooks';
import parse from 'html-react-parser';

export const AppsViewLayout: React.FC = () => {
  const { appId, appVersion } = useGetAppParams();
  const { data } = useAppsListing();
  const htmlApp = data?.htmlDefinitions[appId];
  const key = `${appId}-${appVersion}`;
  return (
    <>
      {htmlApp ? (
        <div id="appDetail-wrapper" className="has-external-app">
          {parse(htmlApp.html as string)}
        </div>
      ) : (
        <Suspense
          fallback={
            <Layout>
              <Spinner />
            </Layout>
          }
        >
          {/* <AppFormProvider> */}
          <AppsSubmissionForm key={key} />
          {/* </AppFormProvider> */}
        </Suspense>
      )}
      <Outlet />
    </>
  );
};
