import React from 'react';
import { NavLink } from 'react-router-dom';
import { Layout, Badge } from 'antd';
import { Icon } from '@client/common-components';
import styles from './JobStatusNav.module.css';
// import { useGetNotifications } from '@client/hooks';

export const JobStatusNav: React.FC = () => {
  // const { data: jobNotifs } = useGetNotifications({event_type: 'job'});
  // const { data: interactiveSessionNotifs } = useGetNotifications({event_type: 'interactive_session_ready'});

  // TODOv3: fix unread notification count
  const unreadNotifs = 0;
  // (interactiveSessionNotifs?.unread as number) +
  // (jobNotifs?.unread as number);

  const { Header } = Layout;

  const headerStyle = {
    background: 'transparent',
    padding: 0,
    borderBottom: '1px solid #707070',
    fontSize: 14,
  };
  return (
    <Header style={headerStyle}>
      <Badge count={unreadNotifs} size="small" className={styles.badge}>
        <Icon
          className={`ds-icon-Job-Status ${styles.icon}`}
          label="Job-Status"
        />
      </Badge>
      <NavLink to={`history`}>Job Status</NavLink>
    </Header>
  );
};
