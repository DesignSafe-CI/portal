import React from 'react';
import { Layout } from 'antd';
import { LeafletMap, ReconSidePanel } from '@client/reconportal';
import { ReconEventProvider } from '@client/hooks';

const { Sider, Content } = Layout;

const ReconPortalRoot: React.FC = () => {
  return (
    <ReconEventProvider>
      <Layout
        hasSider
        style={{
          gap: '0px',
        }}
      >
        <Sider width="350px">
          <ReconSidePanel />
        </Sider>
        <Content>
          <LeafletMap />
        </Content>
      </Layout>
    </ReconEventProvider>
  );
};

export default ReconPortalRoot;
