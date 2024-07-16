import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Outlet } from 'react-router-dom';
import { Alert, Layout, Flex, Space } from 'antd';
import {
  AppsSubmissionForm,
  useGetAppParams,
  findAppById,
  AppIcon,
} from '@client/workspace';
import { useAppsListing, useGetAppsSuspense } from '@client/hooks';
import parse from 'html-react-parser';
import styles from './layout.module.css';

export const AppsViewLayout: React.FC = () => {
  const { appId, appVersion } = useGetAppParams();
  const { data: app } = useGetAppsSuspense({ appId, appVersion });
  const { data } = useAppsListing();

  const icon =
    findAppById(data, app.definition.id)?.icon ??
    (app.definition.notes.icon || 'Generic-App');
  const userGuideLink =
    findAppById(data, app.definition.id)?.userGuideLink ??
    app.definition.notes.helpUrl;

  const htmlApp = data?.htmlDefinitions[appId];
  const key = `${appId}-${appVersion}`;

  const { Header } = Layout;
  const headerStyle = {
    background: 'transparent',
    paddingLeft: 0,
    paddingRight: 0,
    borderBottom: '1px solid #707070',
    fontSize: 16,
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Header style={headerStyle}>
        <Flex justify="space-between">
          <div>
            <AppIcon name={icon} />
            {app.definition.notes.label || app.definition.id}
          </div>
          {userGuideLink && (
            <a href={userGuideLink} target="_blank" style={{ marginRight: 10 }}>
              View User Guide
            </a>
          )}
        </Flex>
      </Header>
      {htmlApp ? (
        <div className={styles['overflow']}>
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
          {/* <AppFormProvider> */}
          <AppsSubmissionForm key={key} />
          {/* </AppFormProvider> */}
        </ErrorBoundary>
      )}
      <Outlet />
    </Space>
  );
};
