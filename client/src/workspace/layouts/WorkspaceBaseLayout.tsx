import React from 'react';
import { Outlet } from 'react-router-dom';
import { Flex, Layout } from 'antd';
import {
  AppsSideNav,
  JobStatusNav,
  useGetAppParams,
  AppsBreadcrumb,
} from '@client/workspace';
import { useAppsListing, usePrefetchGetSystems } from '@client/hooks';
import { Spinner } from '@client/common-components';
import { usePrefetchGetApps } from '@client/hooks';

const { Sider, Header } = Layout;

const WorkspaceRoot: React.FC = () => {
  usePrefetchGetApps(useGetAppParams());
  usePrefetchGetSystems();
  const { data, isLoading } = useAppsListing();

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
        <Sider width={200} theme="light" breakpoint="md" collapsedWidth={0}>
          <JobStatusNav />
          <AppsSideNav categories={data.categories} />
        </Sider>
        <Outlet />
      </Layout>
    </Flex>
  );
};

export default WorkspaceRoot;
