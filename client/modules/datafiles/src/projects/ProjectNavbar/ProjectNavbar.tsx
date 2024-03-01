import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './ProjectNavbar.module.css';

export const ProjectNavbar: React.FC<{ projectId: string }> = ({
  projectId,
}) => {
  return (
    <nav>
      <NavLink to={`/projects/${projectId}/workdir`} className={styles.navLink}>
        <div className={`${styles.navBtn} ${styles.navBtnLeft}`}>
          Working Directory
        </div>
      </NavLink>
      <NavLink
        to={`/projects/${projectId}/curation`}
        className={styles.navLink}
      >
        <div className={styles.navBtn}>Curation Directory</div>
      </NavLink>
      <NavLink to={`/projects/${projectId}/preview`} className={styles.navLink}>
        <div className={`${styles.navBtn} ${styles.navBtnRight}`}>
          Publication Preview
        </div>
      </NavLink>
    </nav>
  );
};
