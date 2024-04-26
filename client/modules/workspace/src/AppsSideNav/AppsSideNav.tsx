import React, { useState } from 'react';
import { Menu, MenuProps } from 'antd';
import { NavLink } from 'react-router-dom';
import styles from './AppsSideNav.module.css';
import MenuDivider from 'antd/es/menu/MenuDivider';
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

export const AppsSideNav: React.FC<{ categories: TAppCategory[] }> = ({
  categories,
}) => {
  const [activeApp, setActiveApp] = useState();

  const toggle = (tab: any) => {
    setActiveApp(tab.keyPath);
  };

  const uniqueBundleLabels = new Set<string>();

  categories.forEach((category) => {
    category.apps.forEach((app) => {
      {
        app.is_bundled ?? uniqueBundleLabels.add(app.bundle_label);
      }
    });
  });

  type MenuItem = Required<MenuProps>['items'][number];

  function getItem(
    label: React.ReactNode,
    key?: React.Key | null,
    children?: MenuItem[],
    type?: 'group'
  ): MenuItem {
    return {
      label,
      children,
      key,
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
      getItem(bundle.label, bundle_id, bundle.apps)
    );
  };

  const items: MenuItem[] = categories.map((category) => {
    console.log(getCategoryApps(category));
    return getItem(category.title, category.title, getCategoryApps(category));
  });

  // const items = [
  //   {categories.map((category) => {
  //     getItem
  //   })
  // ];
  //  {data?.categories.map((category) => {
  //    const appItems: MenuItem['items'] =

  //      getItem(`${category.title} [${category.apps.length}]`, category.title, [
  //        category.apps.map((app) => app.is_bundled ?
  //        getItem(app.bundle_label, app.bundle_label, [app.label]) : (getItem(`${category.title} [${category.apps.length}]`, category.title, )))]

  //      )
  //  })
  //};

  return (
    <Menu
      mode="inline"
      onClick={toggle}
      selectedKeys={activeApp}
      className={styles.apps}
      items={items}
      // inlineCollapsed={activeApp}
    />
  );
};
