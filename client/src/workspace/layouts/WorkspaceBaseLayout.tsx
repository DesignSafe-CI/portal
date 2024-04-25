import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import {
  useSuspenseQuery,
  useIsFetching,
  type QueryClient,
  queryOptions,
  useQueryClient,
} from '@tanstack/react-query';
import {
  useLoaderData,
  Link,
  NavLink,
  useNavigation,
  useSubmit,
  LoaderFunctionArgs,
} from 'react-router-dom';
import { AppsSideNav, JobStatusNav } from '@client/workspace';
import {
  useAuthenticatedUser,
  useAppsListing,
  appsListingQuery,
} from '@client/hooks';
import { Spinner } from '@client/common-components';

const { Sider } = Layout;

const WorkspaceRoot: React.FC = () => {
  console.log('render workspace root');
  const { data, isLoading } = useAppsListing();

  if (isLoading)
    return (
      <Layout>
        <Spinner />
      </Layout>
    );

  return (
    // <Suspense
    //   fallback={
    //     <Layout>
    //       <Spinner />
    //       <h2>HELLO!!!</h2>
    //     </Layout>
    //   }
    // >
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
        <AppsSideNav categories={data.categories} />
      </Sider>
      <Outlet />
    </Layout>
    // </Suspense>
  );
};

export default WorkspaceRoot;
