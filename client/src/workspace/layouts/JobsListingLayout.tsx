import React from 'react';
import { Layout } from 'antd';
import { useParams } from 'react-router-dom';
import styles from './layout.module.css';
import { JobsListing, JobsDetailModal } from '@client/workspace';

export const JobsListingLayout: React.FC = () => {
  const { uuid } = useParams();
  return (
    <Layout style={{ gap: '5px', minWidth: '500px' }}>
      <Layout.Content className={styles['listing-main']}>
        <div className={styles['listing-container']}>
          <JobsListing />
        </div>
      </Layout.Content>
      {typeof uuid === 'string' && <JobsDetailModal uuid={uuid} />}
    </Layout>
  );
};
