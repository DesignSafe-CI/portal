import { FileListing } from '@client/datafiles';
import { useAuthenticatedUser, useFileListingRouteParams } from '@client/hooks';
import { Layout } from 'antd';
import React from 'react';
import { Navigate } from 'react-router-dom';
import styles from './layout.module.css';

export const FileListingLayout: React.FC = () => {
  const { api, path, scheme, system } = useFileListingRouteParams();
  const { user } = useAuthenticatedUser();
  if (
    !path &&
    api === 'tapis' &&
    ['designsafe.storage.default', 'designsafe.storage.frontera.work'].includes(
      system
    )
  ) {
    return <Navigate to={`../${user?.username}`} />;
  }
  return (
    <Layout style={{ backgroundColor: 'transparent' }}>
      <Layout.Content className={styles['listing-main']}>
        <div className={styles['listing-container']}>
          <FileListing api={api} system={system} path={path} scheme={scheme} />
        </div>
      </Layout.Content>
    </Layout>
  );
};
//
