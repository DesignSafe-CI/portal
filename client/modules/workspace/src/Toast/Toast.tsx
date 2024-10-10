import React, { useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { useQueryClient } from '@tanstack/react-query';
import { notification, Flex } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@client/common-components';
import {
  TJobStatusNotification,
  TGetNotificationsResponse,
  useInteractiveModalContext,
  TInteractiveModalContext,
} from '@client/hooks';
import { getToastMessage } from '../utils';
import styles from './Notifications.module.css';

const Notifications = () => {
  const { lastMessage } = useWebSocket(
    `wss://${window.location.host}/ws/websockets/`
  );

  const [api, contextHolder] = notification.useNotification({ maxCount: 1 });
  const [interactiveModalDetails, setInteractiveModalDetails] =
    useInteractiveModalContext() as TInteractiveModalContext;

  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const handleNotification = (notification: TJobStatusNotification) => {
    switch (notification.event_type) {
      case 'interactive_session_ready':
        if (interactiveModalDetails.show) {
          setInteractiveModalDetails({
            ...interactiveModalDetails,
            interactiveSessionLink: notification.action_link,
            message: notification.message,
          });
        }
      /* falls through */
      case 'job':
        queryClient.invalidateQueries({
          queryKey: ['workspace', 'notifications'],
        });
        queryClient.invalidateQueries({
          queryKey: ['workspace', 'jobsListing'],
        });
        api.open({
          message: (
            <Flex justify="space-between">
              {getToastMessage(notification)}
              <RightOutlined style={{ marginRight: -5, marginLeft: 10 }} />
            </Flex>
          ),
          placement: 'bottomLeft',
          icon: <Icon className={`ds-icon-Job-Status`} label="Job-Status" />,
          className: `${
            notification.extra.status === 'FAILED' && styles['toast-is-error']
          } ${styles.root}`,
          closeIcon: false,
          duration: 5,
          onClick: () => {
            navigate('/history');
          },
        });
        break;
      case 'markAllNotificationsAsRead':
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
        break;
    }
  };

  useEffect(() => {
    if (lastMessage !== null) {
      handleNotification(JSON.parse(lastMessage.data));
    }
  }, [lastMessage]);

  return contextHolder;
};

export default Notifications;
