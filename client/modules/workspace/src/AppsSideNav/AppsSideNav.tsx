import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './AppsSideNav.module.css';
import {
  useAuthenticatedUser,
  useAppsListing,
  TAppCategory,
} from '@client/hooks';

const AppsNavLink: React.FC<React.PropsWithChildren<{ to: string }>> = ({
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

export const AppsSideNav: React.FC<{ categories: TAppCategory[] }> = ({
  categories,
}) => {
  // const { user } = useAuthenticatedUser();
  // const { data } = useAppsListing();

  return (
    <ul className={styles.navList}>
      <>
        {categories.map((category) => (
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
    </ul>
  );
};