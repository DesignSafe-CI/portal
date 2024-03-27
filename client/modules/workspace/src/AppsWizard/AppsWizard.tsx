import React from 'react';
import { useAuthenticatedUser } from '@client/hooks';
import styles from './AppsWizard.module.css';
import { useGetApps } from '@client/hooks';
import { Spin } from 'antd';

export const AppsWizard: React.FC<{ appId: string; appVersion?: string }> = ({
  appId,
  appVersion,
}) => {
  const { user } = useAuthenticatedUser();
  const { data, isLoading } = useGetApps({ appId, appVersion });
  return (
    <ul className={styles.navList}>
      {isLoading && <Spin className={styles.spinner} />}
      {user && data && !isLoading && (
        <div>{data.definition.notes.label || data.definition.id}</div>
      )}
    </ul>
  );
};
