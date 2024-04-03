import { createBrowserRouter, Navigate } from 'react-router-dom';
import WorkspaceRoot from './layouts/WorkspaceBaseLayout';
import { JobsListingLayout } from './layouts/JobsListingLayout';
import { AppsViewLayout } from './layouts/AppsViewLayout';
import { AppsPlaceholderLayout } from './layouts/AppsPlaceholderLayout';
import { JobsDetailModal } from '@client/workspace';
import { appsListingQuery } from '@client/hooks';
import { QueryClient } from '@tanstack/react-query';

const workspaceRootLoader = (queryClient: QueryClient) => async () => {
  return (
    queryClient.getQueryData(appsListingQuery.queryKey) ??
    (await queryClient.fetchQuery(appsListingQuery))
  );
};

const queryClient = new QueryClient();

const workspaceRouter = createBrowserRouter(
  [
    {
      id: 'root',
      path: '/',
      element: <WorkspaceRoot />,
      loader: workspaceRootLoader(queryClient),
      children: [
        {
          path: 'applications',
          children: [
            {
              path: '',
              element: <AppsPlaceholderLayout />,
            },
            {
              id: 'app',
              path: ':appId',
              element: <AppsViewLayout />,
            },
          ],
        },
        {
          path: 'history',
          children: [
            {
              id: 'history',
              path: '',
              element: <JobsListingLayout />,
            },
            {
              id: 'detail',
              path: ':uuid',
              element: <JobsDetailModal />,
            },
          ],
        },
        {
          path: '*',
          element: <Navigate to={'/'} replace={true} />,
        },
      ],
    },
  ],
  { basename: '/rw/workspace' }
);

export default workspaceRouter;
