import React, { useState } from 'react';
import { Menu, MenuProps, MenuItem } from 'antd';
import { NavLink } from 'react-router-dom';
import styles from './AppsSideNav.module.css';
import MenuDivider from 'antd/es/menu/MenuDivider';
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
    <Menu.Item>
      <NavLink to={to} className={styles.navLink}>
        <div>{children}</div>
      </NavLink>
    </Menu.Item>
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

  //type MenuItem = Required<MenuProps>['items'][number];

  // function getItem(label, key, icon, children, type) {
  //   return {
  //     key,
  //     icon,
  //     children,
  //     label,
  //     type,
  //   };
  // }
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
      inlineCollapsed={activeApp}
    >
      <MenuDivider />
      <h3>Applications:</h3>
      <MenuDivider />
    </Menu>
  );
};
