import { FileListing } from '@client/datafiles';
import { useFileListingRouteParams } from '@client/hooks';
import { Layout } from 'antd';
import React from 'react';

export const FileListingLayout: React.FC = () => {
  const { api, path, scheme, system } = useFileListingRouteParams();

  return (
    <Layout style={{ backgroundColor: 'transparent' }}>
      <Layout.Content style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: '1 0 0', overflow: 'auto' }}>
          <FileListing api={api} system={system} path={path} scheme={scheme} />
        </div>
      </Layout.Content>
    </Layout>
  );
};
//
