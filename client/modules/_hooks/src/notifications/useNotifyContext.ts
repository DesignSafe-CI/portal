import React, { useContext } from 'react';
import { NotificationInstance } from 'antd/es/notification/interface';

export const notifyContext = React.createContext<{
  notifyApi?: NotificationInstance;
  contextHolder?: React.ReactElement;
}>({});

export const useNotifyContext = () => useContext(notifyContext);
