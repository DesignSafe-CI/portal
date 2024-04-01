import React from 'react';
import { Outlet, useRouteLoaderData, Await } from 'react-router-dom';
import { Layout } from 'antd';
import { AppsSideNav, JobStatusNav } from '@client/workspace';
import { Spinner } from '@client/common-components';
import { AppCategories } from '@client/hooks';

const { Sider } = Layout;

const WorkspaceRoot: React.FC = () => {
  const { categories } = useRouteLoaderData('root') as AppCategories;

  return (
    <React.Suspense
      fallback={
        <Layout>
          <Spinner />
        </Layout>
      }
    >
      <Await resolve={categories} errorElement={<p>Error loading apps!</p>}>
        <Layout
          hasSider
          style={{
            backgroundColor: 'transparent',
            gap: '20px',
            paddingLeft: '20px',
            paddingRight: '20px',
            overflowX: 'auto',
            overflowY: 'hidden',
          }}
        >
          <Sider width={200} theme="light" breakpoint="md" collapsedWidth={0}>
            <h1 className="headline headline-research" id="headline-data-depot">
              <span className="hl hl-research">Tools and Applications</span>
            </h1>
            <JobStatusNav />
            <AppsSideNav />
          </Sider>
          <Outlet />
        </Layout>
      </Await>
    </React.Suspense>
  );
};

export default WorkspaceRoot;
