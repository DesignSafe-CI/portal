import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './DatafilesSideNav.module.css';

const DataFilesNavLink: React.FC<React.PropsWithChildren<{ to: string }>> = ({
  to,
  children,
}) => {
  return (
    <li>
      <NavLink to={to} className={styles.navLink}>
        <div>{children}</div>
      </NavLink>
    </li>
  );
};

export const DatafilesSideNav: React.FC = () => {
  return (
    <ul
      style={{
        border: '1px solid #e3e3e3',
        listStyleType: 'none',
        paddingLeft: '0px',
      }}
    >
      <DataFilesNavLink to="/tapis/designsafe.storage.default">
        My Data
      </DataFilesNavLink>
      <DataFilesNavLink to="/tapis/designsafe.storage.work">
        My Data (Work)
      </DataFilesNavLink>
      <DataFilesNavLink to="/projects">My Projects</DataFilesNavLink>
      <DataFilesNavLink to="/shared/designsafe.storage.default">
        Shared with Me
      </DataFilesNavLink>

      <hr style={{ margin: '0' }} />

      <DataFilesNavLink to="/box">Box.com</DataFilesNavLink>
      <DataFilesNavLink to="/dropbox">Dropbox.com</DataFilesNavLink>
      <DataFilesNavLink to="/googledrive">Google Drive</DataFilesNavLink>

      <hr style={{ margin: '0' }} />

      <DataFilesNavLink to="/public/designsafe.storage.published">
        Published
      </DataFilesNavLink>

      <hr style={{ margin: '0' }} />
      <DataFilesNavLink to="/public/nees.public">
        Published (NEES)
      </DataFilesNavLink>
      <DataFilesNavLink to="/tapis/designsafe.storage.community">
        Community Data
      </DataFilesNavLink>
    </ul>
  );
};
