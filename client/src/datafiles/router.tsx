import React from 'react';
import DataFilesRoot from './layouts/DataFilesRoot';

import {
  createBrowserRouter,
  Outlet,
  Navigate,
  useParams,
  NavigateProps,
  generatePath,
  useLocation,
} from 'react-router-dom';

const NavigateToUrlSafePath: React.FC<NavigateProps & { to: string }> = ({
  to,
  relative,
  replace,
  state,
}) => {
  const { '*': splatPath, ...params } = useParams();

  return (
    <Navigate
      to={generatePath(to, {
        ...params,
        path: encodeURIComponent(splatPath ?? ''),
      })}
      relative={relative}
      replace={replace}
      state={state}
    />
  );
};

const RedirectAgaveToTapis: React.FC<Omit<NavigateProps, 'to'>> = ({
  relative,
  replace,
  state,
}) => {
  const location = useLocation();
  return (
    <Navigate
      to={location.pathname.replace('agave', 'tapis')}
      relative={relative}
      replace={replace}
      state={state}
    />
  );
};

const datafilesRouter = createBrowserRouter(
  [
    {
      path: '/',
      element: <DataFilesRoot />,
      children: [
        {
          path: 'public-legacy',
          element: <Navigate to="/public/nees.public" replace />,
        },
        {
          path: 'public/nees.public',
          children: [
            {
              path: '',
              element: <div>NEES publication listing</div>,
            },
            {
              path: ':neesid',
              element: (
                <div>
                  NEES publication Landing Page <Outlet />
                </div>
              ),
              children: [
                { path: ':path', element: <div>NEES file listing</div> },
              ],
            },
          ],
        },
        {
          path: 'public/designsafe.storage.community/*',
          element: (
            <NavigateToUrlSafePath
              to="/tapis/designsafe.storage.community/:path"
              replace
            />
          ),
        },
        {
          path: 'public',
          children: [
            {
              path: '',
              element: <Navigate to="designsafe.storage.published" replace />,
            },
            {
              path: 'designsafe.storage.published',
              element: <div>Base Publication listing</div>,
            },
            {
              path: 'designsafe.storage.published/:projectId',
              element: (
                <div>
                  Project Landing Page <Outlet />
                </div>
              ),
              children: [
                {
                  path: ':path',
                  element: <div>Publication Listing</div>,
                },
                {
                  path: '*',
                  element: <NavigateToUrlSafePath to=":path" replace />,
                },
              ],
            },
          ],
        },

        {
          path: 'projects',
          children: [
            {
              path: '',
              element: <div>Projects Listing</div>,
            },
            {
              path: ':uuid/prepare-to-publish',
              element: <div>Publication Pipeline</div>,
            },
            {
              path: ':uuid/preview',
              element: <div>Publication Preview</div>,
            },
            {
              path: ':uuid',
              element: (
                <div>
                  Project Landing Page <Outlet />
                </div>
              ),
              children: [
                {
                  path: 'curation/:path?',
                  element: <div>Curation View</div>,
                },
                {
                  path: 'workdir/:path?',
                  element: <div>Working Directory View</div>,
                },
                {
                  path: '*',
                  element: <NavigateToUrlSafePath to="workdir/:path" replace />,
                },
              ],
            },
          ],
        },
        {
          path: 'googledrive',
          children: [
            {
              path: ':path?',
              element: <div>standard listing goes here</div>,
            },
            {
              path: '*',
              element: <NavigateToUrlSafePath to=":path" replace />,
            },
          ],
        },
        {
          path: 'dropbox',
          children: [
            {
              path: ':path?',
              element: <div>standard listing goes here</div>,
            },
            {
              path: '*',
              element: <NavigateToUrlSafePath to=":path" replace />,
            },
          ],
        },
        {
          path: 'box',
          children: [
            {
              path: ':path?',
              element: <div>standard listing goes here</div>,
            },
            {
              path: '*',
              element: <NavigateToUrlSafePath to=":path" replace />,
            },
          ],
        },
        {
          path: 'agave/*',
          element: <RedirectAgaveToTapis replace />,
        },
        {
          path: ':api/:system',
          children: [
            {
              path: ':path?',
              element: <div>standard listing goes here</div>,
            },
            {
              path: '*',
              element: <NavigateToUrlSafePath to=":path" />,
            },
          ],
        },
      ],
    },
  ],
  { basename: '/data/browser/' }
);

export default datafilesRouter;
