import React, { useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { notification } from 'antd';
import { Icon } from '@client/common-components';
import { type TJobStatusNotification, getToastMessage } from '../utils';
import styles from './Notifications.module.css';

const Notifications = () => {
  const { lastMessage } = useWebSocket(
    `wss://${window.location.host}/ws/websockets/`
  );

  const [api, contextHolder] = notification.useNotification({ maxCount: 1 });

  const openNotification = (notification: TJobStatusNotification) => {
    api.open({
      message: getToastMessage(notification),
      placement: 'bottomLeft',
      icon: <Icon className={`ds-icon-Job-Status`} label="Job-Status" />,
      className: `${
        notification.extra.status === 'FAILED' && styles['toast-is-error']
      }`,
      closeIcon: false,
    });
  };

  useEffect(() => {
    if (lastMessage !== null) {
      openNotification(JSON.parse(lastMessage.data));
    }
  }, [lastMessage]);

  return <>{contextHolder}</>;
};

export default Notifications;
