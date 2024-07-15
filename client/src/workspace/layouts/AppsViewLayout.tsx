import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Outlet } from 'react-router-dom';
import { Alert, Layout } from 'antd';
import { Spinner } from '@client/common-components';
import { AppsSubmissionForm, useGetAppParams } from '@client/workspace';
import { useAppsListing } from '@client/hooks';
import parse from 'html-react-parser';
import styles from './layout.module.css';

export const AppsViewLayout: React.FC = () => {
  const { appId, appVersion } = useGetAppParams();
  const { data } = useAppsListing();
  const htmlApp = data?.htmlDefinitions[appId];
  const key = `${appId}-${appVersion}`;
  return (
    <>
      {htmlApp ? (
        <div className={styles['center-overflow']}>
          {parse(htmlApp.html as string)}
        </div>
      ) : (
        <ErrorBoundary
          key={key}
          fallbackRender={({ error }) =>
            error && (
              <div id="appDetail-wrapper">
                <Alert
                  message={error?.response?.data?.message ?? error.message}
                  type="error"
                  showIcon
                  style={{ marginTop: 10 }}
                />
              </div>
            )
          }
        >
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
        </ErrorBoundary>
      )}
      <Outlet />
    </>
  );
};
