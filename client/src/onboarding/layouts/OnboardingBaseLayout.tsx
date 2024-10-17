import React from 'react';
import { Outlet } from 'react-router-dom';
import { Flex, Layout } from 'antd';
import OnboardingWebsocketHandler from './OnboardingWebsocketHandler';

const OnboardingRoot: React.FC = () => {
  const headerStyle = {
    background: 'transparent',
    padding: 0,
    borderBottom: '1px solid #707070',
    alignContent: 'center',
  };

  return (
    <Flex
      vertical
      style={{
        margin: '-20px 50px 0 50px',
      }}
    >
      <Layout
        hasSider
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
