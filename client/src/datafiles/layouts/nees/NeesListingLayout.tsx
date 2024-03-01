import React from 'react';
import { Layout } from 'antd';
import { NeesListing } from '@client/datafiles';

export const NEESListingLayout: React.FC = () => {
  return (
    <Layout>
      <div>Placeholder for the NEES listing view.</div>
      <div style={{ flex: '1 0 0 ', height: '100%', overflow: 'auto' }}>
        <NeesListing />
      </div>
    </Layout>
  );
};
