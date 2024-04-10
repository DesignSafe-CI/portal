import React from 'react';
import { Outlet, useLocation, useNavigation } from 'react-router-dom';
import { Layout } from 'antd';
import { AppsSideNav, JobStatusNav, AppsBreadcrumb } from '@client/workspace';
import styles from './layout.module.css';
import { useAuthenticatedUser, useAppsListing } from '@client/hooks';
import { Spinner } from '@client/common-components';

const { Sider } = Layout;

const WorkspaceRoot: React.FC = () => {

  const { user } = useAuthenticatedUser();
  const { isLoading } = useAppsListing();

  if (!user || isLoading)
    return (
      <Layout>
        <Spinner />
      </Layout>
    );

  return (
    <>
      <AppsBreadcrumb />
      <Layout hasSider className={styles.layoutContainer}>
        <Sider width={200} theme="light" breakpoint="md" collapsedWidth={0}>
          <h1 className="headline headline-research" id="headline-data-depot">
            <span className="hl hl-research">Tools and Applications</span>
          </h1>
          <JobStatusNav />
          <AppsSideNav />
        </Sider>
        <Outlet />
      </Layout>
    </>
  );
};

export default WorkspaceRoot;
