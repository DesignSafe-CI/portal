import React from 'react';
import { Layout, Flex } from 'antd';
import { ReconPortal, ReconSidePanel } from '@client/reconportal';
import { SelectedReconPortalEventProvider } from '@client/hooks';

const { Sider, Content } = Layout;

const ReconPortalRoot: React.FC = () => {
  return (
    <SelectedReconPortalEventProvider>
      <Flex
        vertical
        style={{
          margin: '-20px 0 0 0px',
          height: '100vh',
        }}
      >
        <Layout
          hasSider
          style={{
            gap: '0px',
          }}
        >
          <Sider width="20%" breakpoint="md" collapsedWidth={0}>
            <Flex vertical justify="left" style={{ height: '100%' }}>
              <ReconSidePanel />
            </Flex>
          </Sider>
          <Content>
            <ReconPortal />
          </Content>
        </Layout>
      </Flex>
    </SelectedReconPortalEventProvider>
  );
};

export default ReconPortalRoot;
