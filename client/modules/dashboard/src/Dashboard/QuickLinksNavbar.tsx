import React from 'react';
import styles from './Dashboard.module.css';
import FavoriteTools from './FavoriteTools';

const Quicklinks = () => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarTitle}>Quick Links</div>

      {/* Favorite Tools */}
      <div style={{ marginBottom: '1rem' }}>
        <FavoriteTools />
      </div>

      <a href="/account" className={styles.sidebarLink}>
        <i className="fa fa-user" style={{ marginRight: '8px' }}></i>
        Manage Account
      </a>

      <a href="/workspace" className={styles.sidebarLink}>
        <i className="fa fa-wrench" style={{ marginRight: '8px' }}></i>
        Tools & Applications
      </a>

      <a href="/learning-center/overview" className={styles.sidebarLink}>
        <i className="fa fa-book" style={{ marginRight: '8px' }}></i>
        Training
      </a>
    </div>
  );
};

export default Quicklinks;
