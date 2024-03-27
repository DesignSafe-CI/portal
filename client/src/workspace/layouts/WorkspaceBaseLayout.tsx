import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { AppsSideNav, JobStatusNav } from '@client/workspace';

const { Sider } = Layout;

const WorkspaceRoot: React.FC = () => {
  return (
    <Layout
      hasSider
      style={{
        backgroundColor: 'transparent',
        gap: '20px',
        paddingLeft: '20px',
        paddingRight: '20px',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      <Sider width={200} theme="light" breakpoint="md" collapsedWidth={0}>
        <h1 className="headline headline-research" id="headline-data-depot">
          <span className="hl hl-research">Tools and Applications</span>
        </h1>
        <JobStatusNav />
        <AppsSideNav />
      </Sider>
      <Outlet />
    </Layout>
  );
};

export default WorkspaceRoot;