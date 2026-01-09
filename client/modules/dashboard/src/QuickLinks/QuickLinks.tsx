import React from 'react';
import styles from '../Dashboard/Dashboard.module.css';

const Quicklinks = () => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarTitle}>Quick Links</div>
      <a href="/account" className={styles.sidebarLink}>
        <i className="fa fa-user" style={{ marginRight: '8px' }}></i>
        Manage Account
      </a>

      <a href="/learning-center/overview" className={styles.sidebarLink}>
        <i className="fa fa-book" style={{ marginRight: '8px' }}></i>
        Training
      </a>
    </div>
  );
};

export default Quicklinks;
