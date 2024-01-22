import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { DatafilesSideNav } from '@client/datafiles';

const { Sider } = Layout;

const DataFilesRoot: React.FC = () => {
  return (
    <Layout
      hasSider
      style={{
        backgroundColor: 'transparent',
        gap: '20px',
        paddingLeft: '20px',
        paddingRight: '20px',
      }}
    >
      <Sider width={250} theme="light">
        <h1 className="headline headline-research" id="headline-data-depot">
          <span className="hl hl-research">Data Depot</span>
        </h1>

        <DatafilesSideNav />
      </Sider>
      <Outlet />
    </Layout>
  );
};

export default DataFilesRoot;
