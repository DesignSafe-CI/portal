import { PublishedListing } from '@client/datafiles';
import { Layout } from 'antd';
import React from 'react';

export const PublishedListingLayout: React.FC = () => {
  return (
    <Layout>
      <div>Placeholder for the publication listing searchbar</div>
      <div style={{ flex: '1 0 0 ', height: '100%', overflow: 'auto' }}>
        <PublishedListing />
      </div>
    </Layout>
  );
};
