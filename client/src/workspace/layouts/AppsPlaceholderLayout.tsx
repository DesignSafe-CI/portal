import { Layout } from 'antd';
import React from 'react';
import styles from './layout.module.css';
import { AppCategories } from '@client/hooks';
import { useRouteLoaderData } from 'react-router-dom';

export const AppsPlaceholderLayout: React.FC = () => {
  const { categories } = useRouteLoaderData('root') as AppCategories;

  const hasApps = categories?.length > 0;

  return (
    <Layout style={{ gap: '5px', minWidth: '500px' }}>
      <Layout.Content
        className={`${styles['appDetail-wrapper']} ${styles['has-message']} ${styles['appDetail-placeholder-message']}`}
      >
        {hasApps
          ? `Select an app from the tray to submit a job.`
          : `No apps to show.`}
      </Layout.Content>
    </Layout>
  );
};
