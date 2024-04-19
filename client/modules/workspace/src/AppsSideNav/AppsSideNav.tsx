import React, { useState } from 'react';
import { Menu } from 'antd';
import { NavLink } from 'react-router-dom';
import styles from './AppsSideNav.module.css';
import { useAuthenticatedUser, useAppsListing } from '@client/hooks';
import MenuDivider from 'antd/es/menu/MenuDivider';

const AppsNavLink: React.FC<React.PropsWithChildren<{ to: string }>> = ({
  to,
  children,
}) => {
  return (
    <Menu.Item>
      <NavLink to={to} className={styles.navLink}>
        <div>{children}</div>
      </NavLink>
  </Menu.Item>
  );
};

export const AppsSideNav: React.FC = () => {
  const { user } = useAuthenticatedUser();
  const { data } = useAppsListing();
  const [activeApp, setActiveApp] = useState<string[]>([]); 

  const toggle = (tab: any) => {
    setActiveApp(tab.keyPath)
  };

  const uniqueBundleLabels = new Set<string>();

  if (user && data) {
    data.categories.forEach((category) => {
      category.apps.forEach((app) => {
        uniqueBundleLabels.add(app.bundle_label);
      });
    });
  }

  return (
    <Menu
      mode="inline"
      onClick={toggle}
      selectedKeys={activeApp}
      className={styles.apps}
    >
      <MenuDivider/>
        <h3>Applications:</h3>
        {user && data && (
          <>
            {data.categories.map((category) => (
              <Menu.SubMenu
                key={category.title}
                title={`${category.title} [${category.apps.length}]`}
              >
                {category.apps.length > 0 && (
                  Array.from(new Set(category.apps.map((app) => app.bundle_label))).map((bundleLabel) => (
                    <Menu.SubMenu
                      key={bundleLabel}
                      title={`${bundleLabel} [${
                        category.apps.filter((app) => app.bundle_label === bundleLabel).length
                      }]`}
                    >
                      {category.apps
                        .filter((app) => app.bundle_label === bundleLabel) 
                        .map((app) => (
                          <AppsNavLink
                            key={`${app.app_id}-${app.version}`}
                            to={
                              `${app.app_id}` +
                              (app.version ? `?appVersion=${app.version}` : '')
                            }
                          >
                            {app.label}
                          </AppsNavLink>
                        ))}
                    </Menu.SubMenu>
                  ))
                )}
              </Menu.SubMenu>
            ))}
          </>
        )}
      <MenuDivider/>
    </Menu>
  );
};
