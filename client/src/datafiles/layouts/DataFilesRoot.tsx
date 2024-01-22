import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import { DatafilesSideNav } from '@client/datafiles';

const { Sider, Content } = Layout;

const DataFilesRoot: React.FC = () => {
  return (
    <Layout style={{ backgroundColor: 'white' }}>
      <Sider
        style={{ paddingLeft: '20px', paddingRight: '20px' }}
        width={250}
        theme="light"
      >
        <h1 className="headline headline-research" id="headline-data-depot">
          <span className="hl hl-research">Data Depot</span>
        </h1>

        <DatafilesSideNav />
      </Sider>
      <Content>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default DataFilesRoot;
