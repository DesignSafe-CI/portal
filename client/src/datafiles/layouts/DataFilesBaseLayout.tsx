import React, { useEffect } from 'react';
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
import { useWebSocket } from 'react-use-websocket/dist/lib/use-websocket';

const { Sider } = Layout;

type TDataFilesNotification = {
  event_type: string;
  status: string;
  message: string;
};

const DataFilesRoot: React.FC = () => {
  const { user } = useAuthenticatedUser();

  if (user && !user.setupComplete) {
    window.location.replace(`${window.location.origin}/onboarding/setup`);
  }

  const defaultPath = user?.username
    ? `/tapis/${USER_MYDATA_SYSTEM}`
    : '/public/designsafe.storage.published';
  const { pathname } = useLocation();

  const { lastMessage } = useWebSocket(
    `wss://${window.location.host}/ws/websockets/`
  );

  const [notifyApi, contextHolder] = notification.useNotification();

  useEffect(() => {
    if (lastMessage?.data) {
      try {
        const messageJSON = JSON.parse(
          lastMessage.data
        ) as TDataFilesNotification;
        if (messageJSON.event_type === 'data_depot') {
          switch (messageJSON.status) {
            case 'SUCCESS':
              notifyApi.success({
                message: messageJSON.message,
                placement: 'bottomLeft',
              });
              break;
            case 'ERROR':
              notifyApi.error({
                message: messageJSON.message,
                placement: 'bottomLeft',
              });
              break;
            default:
              notifyApi.info({
                message: messageJSON.message,
                placement: 'bottomLeft',
              });
          }
        }
      } catch {
        // pass
      }
    }
  }, [lastMessage, notifyApi]);

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
