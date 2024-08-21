import React from 'react';
import { Layout } from 'antd';
import { useParams } from 'react-router-dom';
import styles from './layout.module.css';
import { JobsListing, JobsDetailModal } from '@client/workspace';

export const JobsListingLayout: React.FC = () => {
  const { uuid } = useParams();

  const headerStyle = {
    background: 'transparent',
    paddingLeft: 0,
    paddingRight: 0,
    borderBottom: '1px solid #707070',
    fontSize: 16,
  };

  return (
    <Layout style={{ gap: '5px', minWidth: '500px' }}>
      <Layout.Header style={headerStyle}>Job Status</Layout.Header>
      <Layout.Content className={styles['listing-main']}>
        <div className={styles['listing-container']}>
          <JobsListing />
        </div>
      </Layout.Content>
      {typeof uuid === 'string' && <JobsDetailModal uuid={uuid} />}
    </Layout>
  );
};
