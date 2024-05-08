import React from 'react';
import { NavLink } from 'react-router-dom';
import { Layout } from 'antd';
import { Icon } from '@client/common-components';
import styles from './JobStatusNav.module.css';

export const JobStatusNav: React.FC = () => {
  const { Header } = Layout;

  const headerStyle = {
    background: 'transparent',
    padding: 0,
    borderBottom: '1px solid #707070',
    fontSize: 14,
  };
  return (
    <Header style={headerStyle}>
      <Icon
        className={`ds-icon-Job-Status ${styles.icon}`}
        label="Job-Status"
      />{' '}
      <NavLink to={`history`}>Job Status</NavLink>
    </Header>
  );
};
