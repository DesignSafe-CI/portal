import React from 'react';
import {
  createBrowserRouter,
  Outlet,
  Navigate,
  useParams,
  NavigateProps,
  useLocation,
} from 'react-router-dom';

const NavigateToUrlSafePath: React.FC<NavigateProps> = ({
  to,
  relative,
  replace,
  state,
}) => {
  const { '*': splatPath } = useParams();
  const location = useLocation();
  const newPath = location.pathname.replace(
    splatPath ?? '',
    `${to}/${encodeURIComponent(splatPath ?? '')}`
  );

  return (
    <Navigate
      to={`${newPath}`}
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
      element: (
        <div>
          hello from datafiles, <Outlet />
        </div>
      ),
      children: [
        {
          path: 'public-legacy',
          element: <div>These are legacy publications</div>,
        },
        {
          path: 'public/nees.public',
          element: (
            <div>
              NEES landing page <Outlet />
            </div>
          ),
          children: [
            {
              path: '',
              element: <Navigate to="/public-legacy" />,
            },
            {
              path: ':neesid',
              element: (
                <div>
                  NEES Project Landing Page <Outlet />
                </div>
              ),
              children: [
                { path: ':path', element: <div>NEES file listing</div> },
              ],
            },
          ],
        },
        {
          path: 'public/designsafe.storage.community',
          element: <div>Community Data</div>,
        },
        {
          path: 'public',
          element: (
            <div>
              Published Works <Outlet />
            </div>
          ),
          children: [
            {
              path: '',
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
                  element: <NavigateToUrlSafePath to="" />,
                },
              ],
            },
          ],
        },

        {
          path: 'projects',
          element: (
            <div>
              Projects Base <Outlet />
            </div>
          ),
          children: [
            {
              path: '',
              element: <div>Projects Listing</div>,
            },
            {
              path: ':uuid/curation',
              element: <div>Curation Pipeline</div>,
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
                  element: <NavigateToUrlSafePath to="workdir" />,
                },
              ],
            },
          ],
        },
        {
          path: ':api/:system',
          element: <Outlet />,
          children: [
            {
              path: ':path?',
              element: <div>this is base file listing</div>,
            },
            {
              path: '*',
              element: <NavigateToUrlSafePath to="" />,
            },
          ],
        },
      ],
    },
  ],
  { basename: '/data/browser' }
);

export default datafilesRouter;
