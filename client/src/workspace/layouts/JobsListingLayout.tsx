import { JobsListing } from '@client/workspace';
import { Layout } from 'antd';
import React from 'react';
import styles from './layout.module.css';

export const JobsListingLayout: React.FC = () => {
  return (
    <Layout style={{ gap: '5px', minWidth: '500px' }}>
      <Layout.Content className={styles['listing-main']}>
        <div className={styles['listing-container']}>
          <JobsListing />
        </div>
      </Layout.Content>
    </Layout>
  );
};
