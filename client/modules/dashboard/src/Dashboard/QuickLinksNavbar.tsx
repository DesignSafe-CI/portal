import React from 'react';
import styles from './Dashboard.module.css';
const Quicklinks = () => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarTitle}>Quick Links</div>
      <a href="/account" className={styles.sidebarLink}>
        Manage Account
      </a>
      <a href="/data/browser" className={styles.sidebarLink}>
        Data Depot
      </a>
      <a href="/workspace" className={styles.sidebarLink}>
        Tools & Applications
      </a>
      <a href="/recon-portal" className={styles.sidebarLink}>
        Recon Portal
      </a>
      <a href="/learning-center/overview" className={styles.sidebarLink}>
        Training
      </a>
    </div>
  );
};
export default Quicklinks;