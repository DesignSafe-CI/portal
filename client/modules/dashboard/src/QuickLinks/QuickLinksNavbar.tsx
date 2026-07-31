import styles from './QuickLinksNavbar.module.css';
import FavoriteTools from '../FavoriteTools/FavoriteTools';
// import { NavLink } from 'react-router-dom';
import { UserOutlined, ToolOutlined, BookOutlined } from '@ant-design/icons';

// I don't think we need to use NavLink on here instead of the <a> tags, but I could be mistaken
const QuickLinks: React.FC = () => {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.sidebarTitle}>Quick Links</div>

      <div style={{ marginBottom: '1rem' }}>
        <FavoriteTools />
      </div>

      <a href="/account" className={styles.sidebarLink}>
        <UserOutlined className={styles.sidebarIcon} />
        Manage Account
      </a>
      <a href="/workspace" className={styles.sidebarLink}>
        <ToolOutlined className={styles.sidebarIcon} />
        Tools & Applications
      </a>

      <a href="/learning-center/overview" className={styles.sidebarLink}>
        <BookOutlined className={styles.sidebarIcon} />
        Training
      </a>
    </nav>
  );
};

export default QuickLinks;
