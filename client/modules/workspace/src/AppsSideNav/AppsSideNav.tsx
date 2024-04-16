import React, { useState } from 'react';
import { Menu } from 'antd';
import { NavLink, useRouteLoaderData } from 'react-router-dom';
import styles from './AppsSideNav.module.css';
import { useAuthenticatedUser } from '@client/hooks';
import { AppCategories } from '@client/hooks';

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
  const data = useRouteLoaderData('root') as AppCategories;
  const [activeApp, setActiveApp] = useState<string | string[]>([]);

  const toggle = (tab: any) => {
    setActiveApp(tab.keyPath)
  };

  return (
    <Menu
      mode="inline"
      onClick={toggle}
      selectedKeys={activeApp}
    >
      {user && data && data.categories.map((category) => (
        <Menu.SubMenu key={category.title} title={category.title}>
          <ul>
            {category.apps.map((app) => (
              <AppsNavLink
                key={`${app.app_id}-${app.version}`}
                to={
                  `applications/${app.app_id}` +
                  (app.version ? `?appVersion=${app.version}` : '')
                }
              >
                {app.label}
              </AppsNavLink>
            ))}
          </ul>
        </Menu.SubMenu>
      ))}
    </Menu>
  );
};
