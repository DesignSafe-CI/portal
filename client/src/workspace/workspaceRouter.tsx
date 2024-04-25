import {
  createBrowserRouter,
  Navigate,
  LoaderFunctionArgs,
} from 'react-router-dom';
import { useQuery, useQueryClient, QueryClient } from '@tanstack/react-query';
import WorkspaceRoot from './layouts/WorkspaceBaseLayout';
import { JobsListingLayout } from './layouts/JobsListingLayout';
import { AppsViewLayout } from './layouts/AppsViewLayout';
import { AppsPlaceholderLayout } from './layouts/AppsPlaceholderLayout';
import { JobsDetailModal, AppFormProvider } from '@client/workspace';
import { AppsSideNav, JobStatusNav } from '@client/workspace';
import {
  useAuthenticatedUser,
  useAppsListing,
  appsListingQuery,
  getAppsQuery,
} from '@client/hooks';

export const rootLoader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData(appsListingQuery);
  return {};
};

export const appsLoader =
  (queryClient: QueryClient) =>
  async ({ params, request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const appVersion = url.searchParams.get('appVersion') as string | undefined;
    await queryClient.ensureQueryData(
      getAppsQuery({ appId: params.appId, appVersion })
    );
    return { appId: params.appId, appVersion: appVersion };
  };

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
          // loader: appsLoader(queryClient),
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
