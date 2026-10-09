import { createBrowserRouter, Navigate } from 'react-router-dom';
import { NCOSchedLayout } from './layouts/ncoSchedulerLayout';
import { NCOGrantsLayout } from './layouts/ncoGrantsLayout';

const ncoRouter = createBrowserRouter(
    [
        {
            id: 'root',
            path: '/',
            children: [
                {
                    id: 'scheduler',
                    path: '/scheduler',
                    element: <NCOSchedLayout />,
                },
                {
                    id: 'ttc_grants',
                    path: '/ttc_grants',
                    element: <NCOGrantsLayout />,
                }
            ],
        }
    ],
    { basename: '/nco' }
);

export default ncoRouter;