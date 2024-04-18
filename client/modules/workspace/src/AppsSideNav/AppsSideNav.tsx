import React, { useState } from 'react';
import { Menu } from 'antd';
import { NavLink } from 'react-router-dom';
import styles from './AppsSideNav.module.css';
import { useAuthenticatedUser, useAppsListing } from '@client/hooks';

const AppsNavLink: React.FC<React.PropsWithChildren<{ to: string }>> = ({
  to,
  children,
}) => {
  return (
    <Menu.Item key={to}>
      <NavLink to={to} className={styles.navLink}>
        {children}
      </NavLink>
    </Menu.Item>
  );
};

export const AppsSideNav: React.FC = () => {
  const { user } = useAuthenticatedUser();
  const { data } = useAppsListing();

  return (
    <ul className={styles.navList}>
      {user && data && (
        <>
          {data.categories.map((category) => (
            <div key={category.title}>
              <h3>{category.title}</h3>
              <ul>
                {category.apps.map((app) => (
                  <AppsNavLink
                    key={`${app.app_id}-${app.version}`}
                    to={
                      `${app.app_id}` +
                      (app.version ? `?appVersion=${app.version}` : '')
                    }
                  >
                    {app.app_id} {app.version}
                  </AppsNavLink>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
    </ul>
  );
};
