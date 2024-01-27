import { FileListing } from '@client/datafiles';
import { useAuthenticatedUser, useFileListingRouteParams } from '@client/hooks';
import { Layout } from 'antd';
import React from 'react';
import { Navigate } from 'react-router-dom';

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
      <Layout.Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: '16px',
        }}
      >
        <div style={{ flex: '1 0 0', maxHeight: '1000px', overflow: 'auto' }}>
          <FileListing api={api} system={system} path={path} scheme={scheme} />
        </div>
      </Layout.Content>
    </Layout>
  );
};
//
