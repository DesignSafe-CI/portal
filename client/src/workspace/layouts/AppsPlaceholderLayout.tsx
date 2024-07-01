import { Layout } from 'antd';
import React from 'react';
import styles from './layout.module.css';
import { useAppsListing } from '@client/hooks';

export const AppsPlaceholderLayout: React.FC = () => {
  const { data } = useAppsListing();

  const hasApps = data && data.categories.length > 0;

  return (
    <Layout style={{ gap: '5px', minWidth: '500px' }}>
      <Layout.Content
        className={`${styles['appDetail-wrapper']} ${styles['has-message']} ${styles['appDetail-placeholder-message']}`}
      >
        {hasApps
          ? `Select an app from the menu on the left to submit a job.`
          : `No apps to show.`}
      </Layout.Content>
    </Layout>
  );
};
