import React from 'react';
import { NavLink, useRouteLoaderData } from 'react-router-dom';
import styles from './AppsSideNav.module.css';
import { useAuthenticatedUser } from '@client/hooks';
import { AppCategories } from '@client/hooks';

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

export const AppsSideNav: React.FC = () => {
  const { user } = useAuthenticatedUser();
  const data = useRouteLoaderData('root') as AppCategories;

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
                      `applications/${app.app_id}` +
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
