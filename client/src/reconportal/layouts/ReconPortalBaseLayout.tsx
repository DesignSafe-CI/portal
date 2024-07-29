import React from 'react';
import { Layout } from 'antd';
import { ReconPortal, ReconPortalHeader } from '@client/reconportal';

const ReconPortalBaseLayout: React.FC = () => {
  return (
    <Layout>
      <ReconPortalHeader />
      <ReconPortal />
    </Layout>
  );
};

export default ReconPortalBaseLayout;
