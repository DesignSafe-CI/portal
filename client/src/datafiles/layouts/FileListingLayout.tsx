import {
  DatafilesBreadcrumb,
  DatafilesToolbar,
  FileListing,
} from '@client/datafiles';
import { useAuthenticatedUser, useFileListingRouteParams } from '@client/hooks';
import { Layout } from 'antd';
import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import styles from './layout.module.css';

function getBaseRouteName(api: string, system: string): string {
  if (api === 'googledrive') return 'Google Drive';
  if (api === 'box') return 'Box';
  if (api === 'dropbox') return 'Dropbox';
  return (
    {
      'designsafe.storage.default': 'My Data',
      'designsafe.storage.frontera.work': 'My Data (Work)',
      'designsafe.storage.community': 'Community Data',
    }[system] ?? 'Data Files'
  );
}

export const FileListingLayout: React.FC = () => {
  const { api, path, scheme, system } = useFileListingRouteParams();
  const { user } = useAuthenticatedUser();

  const initialBreadcrumbs = [
    { path: `/${api}/${system}`, title: getBaseRouteName(api, system) },
  ];

  const isUserHomeSystem = [
    'designsafe.storage.default',
    'designsafe.storage.frontera.work',
  ].includes(system);

  const redirectHome =
    user?.username && !path && api === 'tapis' && isUserHomeSystem;
  return (
    <Layout style={{ gap: '5px', minWidth: '500px' }}>
      <DatafilesToolbar />
      {true && (
        <DatafilesBreadcrumb
          initialBreadcrumbs={initialBreadcrumbs}
          path={path}
          excludeBasePath={isUserHomeSystem}
          itemRender={(obj) => {
            //const last = items.indexOf(obj) === items.length - 1;
            return (
              <Link className="breadcrumb-link" to={obj.path ?? '/'}>
                {obj.title}
              </Link>
            );
          }}
        />
      )}
      <Layout.Content className={styles['listing-main']}>
        <div className={styles['listing-container']}>
          {redirectHome && (
            <Navigate
              to={`../${encodeURIComponent('/' + user.username)}`}
              replace
            />
          )}
          <FileListing api={api} system={system} path={path} scheme={scheme} />
        </div>
      </Layout.Content>
    </Layout>
  );
};
//
