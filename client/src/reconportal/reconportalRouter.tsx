import { createBrowserRouter, Navigate } from 'react-router-dom';
import  ReconPortalBaseLayout  from './layouts/ReconPortalBaseLayout';

const reconportalRouter = createBrowserRouter(
  [
    {
      id: 'root',
      path: '/',
      element: <ReconPortalBaseLayout />,
      children: [
        {
          path: '*',
          element: <Navigate to={'/'} replace={true} />,
        },
      ],
    },
  ],
  { basename: '/recon-portal' }
);

export default reconportalRouter;
