import React from 'react';
import { Outlet } from 'react-router-dom';
import { Flex, Layout } from 'antd';
import OnboardingWebsocketHandler from './OnboardingWebsocketHandler';

const OnboardingRoot: React.FC = () => {
  return (
    <Flex
      vertical
      style={{
        margin: '-20px 50px 0 50px',
      }}
    >
      <Layout
        style={{
          gap: '20px',
        }}
      >
        <Outlet />
      </Layout>
      <OnboardingWebsocketHandler />
    </Flex>
  );
};

export default OnboardingRoot;
