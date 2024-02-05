import { ProjectListing } from '@client/datafiles';
import { Layout } from 'antd';
import React from 'react';

export const ProjectListingLayout: React.FC = () => {
  return (
    <Layout>
      <div>Placeholder for the project listing searchbar</div>
      <div style={{ flex: '1 0 0 ', height: '100%', overflow: 'auto' }}>

      <ProjectListing/>
      </div>
    </Layout>
  );
};
