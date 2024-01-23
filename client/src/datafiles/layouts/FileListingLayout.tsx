import { FileListing } from '@client/datafiles';
import { Layout } from 'antd';
import React from 'react';
import { useMatches, useParams } from 'react-router-dom';

export const FileListingLayout: React.FC = () => {
  const {
    api: paramApi,
    system,
    path,
  } = useParams<{ api: string; system: string; path: string }>();
  const matches = useMatches();

  // If API isn't passed as a param, read it from the route ID.
  const api = paramApi ?? matches.slice(-1)[0].id;

  return (
    <Layout style={{ backgroundColor: 'transparent' }}>
      <Layout.Content style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: '1 0 0', overflow: 'auto' }}>
          <FileListing api={api} system={system} path={path} />
        </div>
      </Layout.Content>
    </Layout>
  );
};
//
