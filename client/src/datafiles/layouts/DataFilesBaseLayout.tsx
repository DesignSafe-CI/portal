import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Layout, notification } from 'antd';
import { AddFileFolder, DatafilesSideNav } from '@client/datafiles';
import { useAuthenticatedUser, notifyContext } from '@client/hooks';

const { Sider } = Layout;

const DataFilesRoot: React.FC = () => {
  const { user } = useAuthenticatedUser();
  const defaultPath = user?.username
    ? '/tapis/designsafe.storage.default'
    : '/tapis/designsafe.storage.community';
  const { pathname } = useLocation();

  const [notifyApi, contextHolder] = notification.useNotification();

  return (
    <notifyContext.Provider value={{ notifyApi, contextHolder }}>
      {contextHolder}
      <Layout
        hasSider
        style={{
          backgroundColor: 'transparent',
          gap: '20px',
          paddingLeft: '20px',
          paddingRight: '20px',
          //overflowX: 'auto',
          //overflowY: 'hidden',
        }}
      >
        <Sider width={200} theme="light" breakpoint="md" collapsedWidth={0}>
          <h1 className="headline headline-research" id="headline-data-depot">
            <span className="hl hl-research">Data Depot</span>
          </h1>
          <AddFileFolder />
          <DatafilesSideNav />
        </Sider>
        {pathname === '/' && <Navigate to={defaultPath} replace></Navigate>}
        <Outlet />
      </Layout>
    </notifyContext.Provider>
  );
};

export default DataFilesRoot;
