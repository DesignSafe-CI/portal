import React, { useState } from 'react';
import { Menu, MenuProps } from 'antd';
import { NavLink } from 'react-router-dom';
import styles from './AppsSideNav.module.css';
import { TAppCategory } from '@client/hooks';

const AppsNavLink: React.FC<React.PropsWithChildren<{ to: string }>> = ({
  to,
  children,
}) => {
  return (
    <NavLink to={to} className={styles.navLink}>
      <div>{children}</div>
    </NavLink>
  );
};

export const AppsSideNav: React.FC<{ categories: TAppCategory[] }> = ({categories}) => {

  type MenuItem = Required<MenuProps>['items'][number];

  function getItem(
    label: React.ReactNode,
    key?: React.Key | null,
    children?: MenuItem[],
    type?: 'group'
  ): MenuItem {
    return {
      label,
      key,
      children,
      type,
    } as MenuItem;
  }

  const getCategoryApps = (category) => {
    const bundle = {};

    category.apps.map((app) => {
      if (app.is_bundled) {
        if (bundle[app.bundle_id]) {
          bundle[app.bundle_id].apps.push(
            getItem(
              <AppsNavLink
                to={
                  `${app.app_id}` +
                  (app.version ? `?appVersion=${app.version}` : '')
                }
              >
                {app.label}
              </AppsNavLink>,
              `${app.app_id}${app.version}`
            )
          );
        } else {
          bundle[app.bundle_id] = {
            apps: [
              getItem(
                <AppsNavLink
                  to={
                    `${app.app_id}` +
                    (app.version ? `?appVersion=${app.version}` : '')
                  }
                >
                  {app.label}
                </AppsNavLink>,
                `${app.app_id}${app.version}`
              ),
            ],
            label: app.bundle_label,
          };
        }
      } else {
        return getItem(
          <AppsNavLink
            to={
              `${app.app_id}` +
              (app.version ? `?appVersion=${app.version}` : '')
            }
          >
            {app.label}
          </AppsNavLink>,
          `${app.app_id}${app.version}`
        );
      }
    });
    return Object.entries(bundle).map(([bundle_id, bundle]) =>
      getItem(`${bundle.label} [${bundle.apps.length}]`, bundle_id, bundle.apps)
    );
  };

  const items: MenuItem[] = categories.map((category) => {
    return getItem(`${category.title} [${category.apps.length}]`, category.title, getCategoryApps(category));
  });


  return (
    <div className={styles.appsBrowserSidebar}>

    <h3>Applications:</h3>
    <Menu
      mode="inline"
      items={items}
      className={styles.appsGridList}
    />
    </div>
  );
};
