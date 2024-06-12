import React from 'react';
import { NavLink } from 'react-router-dom';
import { Layout, Badge } from 'antd';
import { Icon } from '@client/common-components';
import styles from './JobStatusNav.module.css';
import { useGetNotifications } from '@client/hooks';

export const JobStatusNav: React.FC = () => {
  const { data } = useGetNotifications({
    event_types: ['interactive_session_ready', 'job'],
    read: false,
  });
  const unreadNotifs = new Set(data?.notifs.map((x) => x.extra.uuid)).size;

  const { Header } = Layout;

  const headerStyle = {
    background: 'transparent',
    padding: 0,
    borderBottom: '1px solid var(--global-color-primary--normal)',
    fontSize: 14,
    borderRight: '1px solid var(--global-color-primary--normal)',
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
