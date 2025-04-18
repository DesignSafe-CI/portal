import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './DatafilesSideNav.module.css';
import {
  useAuthenticatedUser,
  USER_MYDATA_SYSTEM,
  USER_WORK_SYSTEM,
} from '@client/hooks';
import { Tooltip } from 'antd';

const DataFilesNavLink: React.FC<
  React.PropsWithChildren<{ to: string; tooltip?: string }>
> = ({ to, tooltip, children }) => {
  return (
    <li>
      <Tooltip title={tooltip} placement="right">
        <NavLink to={to} className={styles.navLink}>
          <div>{children}</div>
        </NavLink>
      </Tooltip>
    </li>
  );
};

export const DatafilesSideNav: React.FC = () => {
  const { user } = useAuthenticatedUser();
  return (
    <ul
      style={{
        border: '1px solid #e3e3e3',
        listStyleType: 'none',
        paddingLeft: '0px',
      }}
    >
      {user && (
        <>
          <DataFilesNavLink
            to={`/tapis/${USER_MYDATA_SYSTEM}`}
            tooltip="Private directory for your data"
          >
            My Data
          </DataFilesNavLink>

          <DataFilesNavLink
            to={`/tapis/${USER_WORK_SYSTEM}/`}
            tooltip="Work directory on TACC HPC machines for use with Jupyter"
          >
            Work
          </DataFilesNavLink>
          <DataFilesNavLink
            to="/projects"
            tooltip="Group access to shared directories"
          >
            My Projects
          </DataFilesNavLink>

          <hr style={{ margin: '0' }} />

          <DataFilesNavLink
            to="/dropbox"
            tooltip="Access to my Dropbox files for copying"
          >
            Dropbox.com
          </DataFilesNavLink>

          <hr style={{ margin: '0' }} />
        </>
      )}

      <DataFilesNavLink
        to="/public/designsafe.storage.published"
        tooltip="Curated data/projects with DOIs"
      >
        Published
      </DataFilesNavLink>

      <hr style={{ margin: '0' }} />

      <DataFilesNavLink
        to="/public/nees.public"
        tooltip="Network for Earthquake Engineers Simulation (1999-2015)"
      >
        Published (NEES)
      </DataFilesNavLink>
      <DataFilesNavLink
        to="/tapis/designsafe.storage.community"
        tooltip="Non-curated user-contributed data"
      >
        Community Data
      </DataFilesNavLink>
    </ul>
  );
};
