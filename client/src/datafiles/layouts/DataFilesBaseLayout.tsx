import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Layout, notification } from 'antd';
import {
  AddFileFolder,
  DatafilesHelpDropdown,
  DatafilesSideNav,
} from '@client/datafiles';
import {
  useAuthenticatedUser,
  notifyContext,
  USER_MYDATA_SYSTEM,
} from '@client/hooks';

const { Sider } = Layout;

const DataFilesRoot: React.FC = () => {
  const { user } = useAuthenticatedUser();

  if (user && !user.setupComplete) {
    window.location.replace(`${window.location.origin}/onboarding/setup`);
  }

  const defaultPath = user?.username
    ? `/tapis/${USER_MYDATA_SYSTEM}`
    : '/public/designsafe.storage.published';
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
          <DatafilesHelpDropdown />
        </Sider>
        {pathname === '/' && <Navigate to={defaultPath} replace></Navigate>}
        <Outlet />
      </Layout>
    </notifyContext.Provider>
  );
};

export default DataFilesRoot;
