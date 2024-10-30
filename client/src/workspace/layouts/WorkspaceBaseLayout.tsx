import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Flex, Layout } from 'antd';
import {
  AppsSideNav,
  JobStatusNav,
  useGetAppParams,
  AppsBreadcrumb,
  Toast,
  InteractiveSessionModal,
} from '@client/workspace';
import { Spinner } from '@client/common-components';
import {
  usePrefetchGetApps,
  useAppsListing,
  usePrefetchGetSystems,
  usePrefetchGetAllocations,
  InteractiveModalContext,
  useAuthenticatedUser,
} from '@client/hooks';
import styles from './layout.module.css';

const { Sider, Header } = Layout;

const WorkspaceRoot: React.FC = () => {
  usePrefetchGetApps(useGetAppParams());
  usePrefetchGetSystems();
  usePrefetchGetAllocations();
  const { user } = useAuthenticatedUser();

  if (user && !user.setupComplete) {
    window.location.replace(`${window.location.origin}/onboarding/setup`);
  }

  const { data, isLoading } = useAppsListing();
  const [interactiveModalDetails, setInteractiveModalDetails] = useState({
    show: false,
  });

  if (!data || isLoading)
    return (
      <Layout>
        <Spinner />
      </Layout>
    );

  const headerStyle = {
    background: 'transparent',
    padding: 0,
    borderBottom: '1px solid #707070',
    alignContent: 'center',
  };

  return (
    <InteractiveModalContext.Provider
      value={[interactiveModalDetails, setInteractiveModalDetails]}
    >
      <Flex
        vertical
        style={{
          margin: '-20px 50px 0 50px',
        }}
      >
        <Header style={headerStyle}>
          <AppsBreadcrumb />
        </Header>
        <Layout
          hasSider
          style={{
            gap: '20px',
          }}
        >
          <Sider
            width={250}
            theme="light"
            breakpoint="md"
            collapsedWidth={0}
            className={styles['overflow']}
          >
            <JobStatusNav />
            <AppsSideNav categories={data.categories} />
          </Sider>
          <Outlet />
        </Layout>
      </Flex>
      <Toast />
      <InteractiveSessionModal />
    </InteractiveModalContext.Provider>
  );
};

export default WorkspaceRoot;
