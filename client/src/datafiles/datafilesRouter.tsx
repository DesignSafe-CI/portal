import React from 'react';
import DataFilesRoot from './layouts/DataFilesBaseLayout';

import {
  createBrowserRouter,
  Navigate,
  useParams,
  NavigateProps,
  generatePath,
  useLocation,
} from 'react-router-dom';
import { ProjectPreviewLayout } from './layouts/projects/ProjectPreviewLayout';
import { NEESListingLayout } from './layouts/nees/NeesListingLayout';
import { NeesDetailLayout } from './layouts/nees/NeesDetailLayout';
import { FileListingLayout } from './layouts/FileListingLayout';
import { ProjectDetailLayout } from './layouts/projects/ProjectDetailLayout';
import { PublishedDetailLayout } from './layouts/published/PublishedDetailLayout';
import { PublishedListingLayout } from './layouts/published/PublishedListingLayout';
import { ProjectListingLayout } from './layouts/projects/ProjectListingLayout';
import { ProjectPipelineLayout } from './layouts/projects/ProjectPipelineLayout';
import { ProjectCurationLayout } from './layouts/projects/ProjectCurationLayout';
import { ProjectWorkdirLayout } from './layouts/projects/ProjectWorkdirLayout';

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
              element: <NEESListingLayout />,
            },
            {
              path: ':neesid',
              element: <NeesDetailLayout />,
              children: [{ path: ':path', element: <FileListingLayout /> }],
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
              element: <PublishedListingLayout />,
            },
            {
              path: 'designsafe.storage.published/:projectId',
              element: <PublishedDetailLayout />,
              children: [
                {
                  path: ':path',
                  element: <FileListingLayout />,
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
              element: <ProjectListingLayout />,
            },
            {
              path: ':projectId/prepare-to-publish',
              element: <ProjectPipelineLayout />,
            },
            {
              path: ':projectId/preview',
              element: <ProjectPreviewLayout />,
            },
            {
              path: ':projectId',
              element: <ProjectDetailLayout />,
              children: [
                {
                  path: '',
                  element: <Navigate to="workdir" replace />,
                },
                {
                  path: 'curation',
                  children: [
                    { path: ':path?', element: <ProjectCurationLayout /> },
                  ],
                },
                {
                  path: 'workdir',
                  children: [
                    { path: ':path?', element: <ProjectWorkdirLayout /> },
                  ],
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
              id: 'googledrive',
              path: ':path?',
              element: <FileListingLayout />,
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
              id: 'dropbox',
              element: <FileListingLayout />,
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
              id: 'box',
              element: <FileListingLayout />,
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
              id: 'tapis',
              element: <FileListingLayout />,
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
