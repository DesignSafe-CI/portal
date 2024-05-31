import React from 'react';
import { Menu, MenuProps, ConfigProvider, ThemeConfig } from 'antd';
import { NavLink } from 'react-router-dom';
import { Menu, MenuProps } from 'antd';
import { NavLink } from 'react-router-dom';
import { TAppCategory, TPortalApp } from '@client/hooks';
import { useGetAppParams } from '../utils';

export const AppsSideNav: React.FC<{ categories: TAppCategory[] }> = ({
  categories,
}) => {
  
  type MenuItem = Required<MenuProps>['items'][number];

  const AppMenuItemTheme: ThemeConfig = {
    components: {
      Menu: {
        itemHoverBg: "#cbdded",
        itemSelectedBg: "#cbdded",
      },
    },
  }

  function getItem(
    label: React.ReactNode,
    key: string,
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

  const getCategoryApps = (category: TAppCategory) => {
    const bundles: {
      [dynamic: string]: {
        apps: MenuItem[];
        label: string;
      };
    } = {};
    const categoryItems: MenuItem[] = [];

    category.apps.forEach((app) => {
      if (app.is_bundled) {
        const bundleKey = `${app.bundle_label}${app.bundle_id}`;
        if (bundles[bundleKey]) {
          bundles[bundleKey].apps.push(
            getItem(
              <NavLink
                to={
                  `${app.app_id}` +
                  (app.version ? `?appVersion=${app.version}` : '')
                }
              >
                {app.shortLabel || app.label || app.bundle_label}
              </NavLink>,
              `${app.app_id}${app.version}${app.bundle_id}`
            )
          );
        } else {
          bundles[bundleKey] = {
            apps: [
              getItem(
                <NavLink
                  to={
                    `${app.app_id}` +
                    (app.version ? `?appVersion=${app.version}` : '')
                  }
                >
                  {app.shortLabel || app.label || app.bundle_label}
                </NavLink>,
                `${app.app_id}${app.version}${app.bundle_id}`
              ),
            ],
            label: app.bundle_label,
          };
        }
      } else {
        categoryItems.push(
          getItem(
            <NavLink
              to={
                `${app.app_id}` +
                (app.version ? `?appVersion=${app.version}` : '')
              }
            >
              {app.shortLabel || app.label || app.bundle_label}
            </NavLink>,
            `${app.app_id}${app.version}${app.bundle_id}`
          )
        );
      }
    });
    const bundleItems = Object.entries(bundles).map(([bundleKey, bundle]) =>
      getItem(`${bundle.label} [${bundle.apps.length}]`, bundleKey, bundle.apps)
    );

    return categoryItems
      .concat(bundleItems)
      .sort((a, b) => (a?.key as string).localeCompare(b?.key as string));
  };

  const items: MenuItem[] = categories.map((category) => {
    return getItem(
      `${category.title} [${category.apps.length}]`,
      category.title,
      getCategoryApps(category)
    );
  });

  const { appId, appVersion } = useGetAppParams();

  const currentApp = categories
    .map((cat) => cat.apps)
    .flat()
    .find((app) => app.app_id === appId && app.version === (appVersion || ''));
  const currentCategory = categories.find((cat) =>
    cat.apps.includes(currentApp as TPortalApp)
  );
  const currentSubMenu = currentApp?.is_bundled
    ? `${currentApp.bundle_id}`
    : '';
  const defaultKey = `${appId}${appVersion || ''}${currentApp?.bundle_id}`;

  return (
    <>
      <div
        style={{
          display: 'grid',
          justifyContent: 'center',
          padding: 10,
          fontWeight: 700,
        }}
      >
        Applications:
      </div>
      <ConfigProvider theme={AppMenuItemTheme}>
        <Menu
          mode="inline"
          defaultOpenKeys={[
            (currentCategory as TAppCategory)?.title,
            currentSubMenu,
          ]}
          defaultSelectedKeys={[defaultKey]}
          items={items}
          inlineIndent={10}
        />
      </ConfigProvider>
    </>
  );
};
