import {
  BaseFileListingBreadcrumb,
  DatafilesToolbar,
  FileListing,
} from '@client/datafiles';
import { useAuthenticatedUser, useFileListingRouteParams } from '@client/hooks';
import { Layout } from 'antd';
import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import styles from './layout.module.css';

export const FileListingLayout: React.FC = () => {
  const { api, path, scheme, system } = useFileListingRouteParams();
  const { user } = useAuthenticatedUser();

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
        <BaseFileListingBreadcrumb
          api={api}
          system={system}
          path={path}
          itemRender={(obj) => {
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
