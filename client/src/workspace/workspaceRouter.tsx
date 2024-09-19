import { Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { Spinner } from '@client/common-components';
import WorkspaceRoot from './layouts/WorkspaceBaseLayout';
import { JobsListingLayout } from './layouts/JobsListingLayout';
import { AppsViewLayout } from './layouts/AppsViewLayout';
import { AppsPlaceholderLayout } from './layouts/AppsPlaceholderLayout';

const getBaseName = () => {
  if (window.location.pathname.startsWith('/rw/workspace')) {
    return '/rw/workspace';
  }
  return '/workspace';
};

const workspaceRouter = createBrowserRouter(
  [
    {
      id: 'root',
      path: '/',
      element: <WorkspaceRoot />,
      children: [
        {
          path: '',
          element: <AppsPlaceholderLayout />,
        },
        {
          id: 'app',
          path: ':appId',
          element: (
            <Suspense
              fallback={
                <Layout>
                  <Spinner />
                </Layout>
              }
            >
              <AppsViewLayout />
            </Suspense>
          ),
        },
        {
          path: 'history/:uuid?',
          element: <JobsListingLayout />,
        },
        {
          path: '*',
          element: <Navigate to={'/'} replace={true} />,
        },
      ],
    },
  ],
  { basename: getBaseName() }
);

export default workspaceRouter;
