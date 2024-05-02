import { createBrowserRouter, Navigate } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import WorkspaceRoot from './layouts/WorkspaceBaseLayout';
import { JobsListingLayout } from './layouts/JobsListingLayout';
import { AppsViewLayout } from './layouts/AppsViewLayout';
import { AppsPlaceholderLayout } from './layouts/AppsPlaceholderLayout';
import { JobsDetailModal } from '@client/workspace';
import { appsListingQuery, getAppsQuery } from '@client/hooks';

// export const rootLoader = (queryClient: QueryClient) => async () => {
//   await queryClient.ensureQueryData(appsListingQuery);
//   return {};
// };

const workspaceRouter = createBrowserRouter(
  [
    {
      id: 'root',
      path: '/',
      element: <WorkspaceRoot />,
      // loader: rootLoader(queryClient),
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
