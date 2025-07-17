import React from 'react';
import { Badge } from 'antd';
import { Icon } from '@client/common-components';
import styles from './SystemStatusNav.module.css';

interface SystemStatusNavProps {
  onOpenModal: () => void;
}

export const SystemStatusNav: React.FC<SystemStatusNavProps> = ({
  onOpenModal,
}) => (
  <div
    className={styles.root}
    onClick={onOpenModal}
    style={{ cursor: 'pointer' }}
    role="button"
  >
    <div className={styles.navItem}>
      <Badge size="small" className={styles.badge}>
        <Icon
          className={`ds-icon-System-Status ${styles.icon}`}
          label="System-Status"
        />
      </Badge>
      System Status
    </div>
  </div>
);
