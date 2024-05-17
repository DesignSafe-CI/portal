import React, { useState, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { notification } from 'antd';
import { Icon } from '@client/common-components';
import { type TJobStatusNotification, getToastMessage } from '../utils';
import styles from './Notifications.module.css';

const Notifications = () => {
  const [messageHistory, setMessageHistory] = useState<MessageEvent<any>[]>([]);

  const { lastMessage } = useWebSocket(
    `wss://${window.location.host}/ws/websockets/`
  );

  const [api, contextHolder] = notification.useNotification();

  const openNotification = (notification: TJobStatusNotification) => {
    api.open({
      message: ['interactive_session_ready', 'job'].includes(
        notification.event_type
      )
        ? 'Job Status Update'
        : notification.event_type,
      description: getToastMessage(notification),
      placement: 'bottomLeft',
      icon: <Icon className={`ds-icon-Job-Status`} label="Job-Status" />,
      className: `${
        notification.status === 'ERROR' && styles['toast-is-error']
      }`,
    });
  };

  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => prev.concat(lastMessage));
      openNotification(JSON.parse(lastMessage.data));
    }
  }, [lastMessage]);

  return <>{contextHolder}</>;
};

export default Notifications;
