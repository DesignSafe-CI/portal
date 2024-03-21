import { createBrowserRouter, Navigate } from 'react-router-dom';
import WorkspaceRoot from './layouts/WorkspaceBaseLayout';
import { JobsListingLayout } from './layouts/JobsListingLayout';
import { JobsDetailModal } from '@client/workspace';

const workspaceRouter = createBrowserRouter(
  [
    {
      path: '/',
      element: <WorkspaceRoot />,
      children: [
        // {
        //   path: ':appId',
        //   element: <AppsView />,
        // },
        // {
        //   path: ':appId-:appVersion?',
        //   element: <AppsView />,
        // },
        {
          path: 'jobs/history?',
          children: [
            {
              path: '',
              element: <JobsListingLayout />,
            },
            // {
            //   id: 'jobdetail',
            //   path: ':uuid?',
            //   element: <JobsDetailModal />,
            // },
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
