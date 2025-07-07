import React from 'react';
import styles from './Dashboard.module.css';

const Quicklinks = () => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarTitle}>Quick Links</div>
      <a href="/account" className={styles.sidebarLink}>
        Manage Account
      </a>

      <a href="/learning-center/overview" className={styles.sidebarLink}>
        Training
      </a>
    </div>
  );
};

export default Quicklinks;
