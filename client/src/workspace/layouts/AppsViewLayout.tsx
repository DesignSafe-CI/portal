import { AppsWizard } from '@client/workspace';
import { TAppParamsType } from '@client/hooks';
import { Layout } from 'antd';
import React from 'react';
import styles from './layout.module.css';
import { useParams } from 'react-router-dom';

export const AppsViewLayout: React.FC = () => {
  const { appId, appVersion } = useParams() as TAppParamsType;
  return (
    <Layout style={{ gap: '5px', minWidth: '500px' }}>
      <Layout.Content className={styles['listing-main']}>
        <div className={styles['listing-container']}>
          <AppsWizard appId={appId} appVersion={appVersion} />
        </div>
      </Layout.Content>
    </Layout>
  );
};
