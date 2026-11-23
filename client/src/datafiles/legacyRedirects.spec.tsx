import { cleanup, render, waitFor } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from 'react-router-dom';
import { afterEach, expect, it } from 'vitest';
import { NavigateToUrlSafePath, RedirectAgaveToTapis } from './legacyRedirects';

afterEach(cleanup);

const routes: RouteObject[] = [
  {
    path: '/',
    children: [
      {
        path: 'public/designsafe.storage.community',
        children: [
          {
            path: '*',
            element: (
              <NavigateToUrlSafePath
                to="/tapis/designsafe.storage.community/:path"
                replace
              />
            ),
          },
        ],
      },
      {
        path: 'projects/:projectId',
        children: [
          { path: 'workdir/:path?', element: <div>Project files</div> },
          {
            path: '*',
            element: <NavigateToUrlSafePath to="../workdir/:path" replace />,
          },
        ],
      },
      {
        path: 'public/designsafe.storage.published/:projectId',
        children: [
          { path: ':path', element: <div>Published files</div> },
          {
            path: '*',
            element: <NavigateToUrlSafePath to="../:path" replace />,
          },
        ],
      },
      ...['googledrive', 'dropbox', 'box'].map((path) => ({
        path,
        children: [
          { path: ':path?', element: <div>Cloud files</div> },
          {
            path: '*',
            element: <NavigateToUrlSafePath to="../:path" replace />,
          },
        ],
      })),
      {
        path: 'agave',
        children: [{ path: '*', element: <RedirectAgaveToTapis replace /> }],
      },
      {
        // Isolate the generic file route from the cloud/Agave aliases above.
        path: 'tapis/:system',
        children: [
          { path: ':path?', element: <div>Files</div> },
          {
            path: '*',
            element: <NavigateToUrlSafePath to="../:path" replace />,
          },
        ],
      },
    ],
  },
];

it.each([
  ['/tapis/mydata/folder/file.txt', '/tapis/mydata/folder%2Ffile.txt'],
  ['/googledrive/folder/file.txt', '/googledrive/folder%2Ffile.txt'],
  ['/dropbox/folder/file.txt', '/dropbox/folder%2Ffile.txt'],
  ['/box/folder/file.txt', '/box/folder%2Ffile.txt'],
  [
    '/projects/PRJ-123/folder/file.txt',
    '/projects/PRJ-123/workdir/folder%2Ffile.txt',
  ],
  [
    '/public/designsafe.storage.published/PRJ-123/folder/file.txt',
    '/public/designsafe.storage.published/PRJ-123/folder%2Ffile.txt',
  ],
  [
    '/public/designsafe.storage.community/folder/file.txt',
    '/tapis/designsafe.storage.community/folder%2Ffile.txt',
  ],
  [
    '/tapis/mydata/folder/a%20%23%25%3F.txt',
    '/tapis/mydata/folder%2Fa%20%23%25%3F.txt',
  ],
  ['/tapis/mydata/folder%2Ffile.txt', '/tapis/mydata/folder%2Ffile.txt'],
  [
    '/agave/mydata/folder%2Ffile.txt?q=report#results',
    '/tapis/mydata/folder%2Ffile.txt?q=report#results',
  ],
])('normalizes legacy file URL %s', async (initialPath, expectedPath) => {
  const basename = '/data/browser';
  const router = createMemoryRouter(routes, {
    basename,
    initialEntries: [basename + initialPath],
  });

  try {
    render(<RouterProvider router={router} />);
    await waitFor(() => {
      const { pathname, search, hash } = router.state.location;
      expect(pathname + search + hash).toBe(basename + expectedPath);
    });
    expect(router.state.errors).toBeNull();
  } finally {
    router.dispose();
  }
});
