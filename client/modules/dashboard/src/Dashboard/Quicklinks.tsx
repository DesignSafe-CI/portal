import styles from './Dashboard.module.css';
import FavoriteTools from './FavoriteTools';

const Quicklinks = () => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarTitle}>Quick Links</div>
      <FavoriteTools />
      <a href="/account" className={styles.sidebarLink}>
        Manage Account
      </a>
      <a href="/workspace" className={styles.sidebarLink}>
        Tools & Applications
      </a>
      <a href="/learning-center/overview" className={styles.sidebarLink}>
        Training
      </a>
    </div>
  );
};

export default Quicklinks;
