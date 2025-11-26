import React from 'react';
import { Alert } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import styles from './ProjectCurationBanner.module.css';

export const CurationInfoBanner: React.FC = () => {
  const [visible, setVisible] = React.useState(() => {
    return localStorage.getItem('curationBannerDismissed') !== 'true';
  });

  const handleClose = () => {
    localStorage.setItem('curationBannerDismissed', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{ marginBottom: '10px' }}>
      <Alert
        type="warning"
        banner
        closable
        showIcon
        icon={<WarningOutlined style={{ color: '#52c41a' }} />}
        onClose={handleClose}
        className={styles.banner}
        message={
          <span>
            We encourage you to attend{' '}
            <a
              href="https://www.designsafe-ci.org/facilities/virtual-office-hours/"
              target="_blank"
              rel="noreferrer"
            >
              virtual office hours
            </a>{' '}
            to meet with a data curator before starting curation and
            publication.
          </span>
        }
      />
    </div>
  );
};
