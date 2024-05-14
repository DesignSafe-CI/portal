import {
  PublicationSearchSidebar,
  PublicationSearchToolbar,
  PublishedListing,
} from '@client/datafiles';
import { Layout } from 'antd';
import React from 'react';

export const PublishedListingLayout: React.FC = () => {
  return (
    <Layout style={{ paddingBottom: '20px' }}>
      <div
        style={{
          backgroundColor: 'transparent',
          padding: 0,
          marginBottom: '20px',
        }}
      >
        <PublicationSearchToolbar />
      </div>
      <Layout style={{ gap: '10px' }}>
        <Layout.Content
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: '1 0 0',
            overflow: 'auto',
          }}
        >
          <div style={{ flex: '1 0 0', height: '100%', overflow: 'auto' }}>
            <PublishedListing />
          </div>
        </Layout.Content>
        <Layout.Sider width={200} style={{ backgroundColor: 'transparent' }}>
          <PublicationSearchSidebar />
        </Layout.Sider>
      </Layout>
    </Layout>
  );
};
