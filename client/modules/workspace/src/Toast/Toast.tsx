import React, { useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { useQueryClient } from '@tanstack/react-query';
import { notification } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@client/common-components';
import {
  TJobStatusNotification,
  TGetNotificationsResponse,
} from '@client/hooks';
import { getToastMessage } from '../utils';
import styles from './Notifications.module.css';

const Notifications = () => {
  const { lastMessage } = useWebSocket(
    `wss://${window.location.host}/ws/websockets/`
  );

  const [api, contextHolder] = notification.useNotification({ maxCount: 1 });

  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const handleNotification = (notification: TJobStatusNotification) => {
    if (
      notification.event_type === 'job' ||
      notification.event_type === 'interactive_session_ready'
    ) {
      queryClient.invalidateQueries({
        queryKey: ['workspace', 'notifications'],
      });
      queryClient.invalidateQueries({
        queryKey: ['workspace', 'jobsListing'],
      });
      api.open({
        message: getToastMessage(notification),
        placement: 'bottomLeft',
        icon: <Icon className={`ds-icon-Job-Status`} label="Job-Status" />,
        className: `${
          notification.extra.status === 'FAILED' && styles['toast-is-error']
        }`,
        closeIcon: false,
        duration: 5,
        onClick: () => {
          navigate('/history');
        },
        style: { cursor: 'pointer' },
      });
    } else if (notification.event_type === 'markAllNotificationsAsRead') {
      // update unread count state
      queryClient.setQueryData(
        [
          'workspace',
          'notifications',
          {
            eventTypes: ['interactive_session_ready', 'job'],
            read: false,
            markRead: false,
          },
        ],
        (oldData: TGetNotificationsResponse) => {
          return {
            ...oldData,
            notifs: [],
            unread: 0,
          };
        }
      );
    }
  };

  useEffect(() => {
    if (lastMessage !== null) {
      handleNotification(JSON.parse(lastMessage.data));
    }
  }, [lastMessage]);

  return <>{contextHolder}</>;
};

export default Notifications;
