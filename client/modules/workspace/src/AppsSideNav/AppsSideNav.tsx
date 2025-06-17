import React from 'react';
import { Menu, MenuProps } from 'antd';
import { NavLink } from 'react-router-dom';
import { TAppCategory, TPortalApp } from '@client/hooks';
import { useGetAppParams } from '../utils';

interface RecentTool {
  label: string;
  path: string;
}

const handleToolClick = (toolName: string, toolPath: string) => {
  const correctedPath = toolPath.startsWith('/workspace/')
    ? toolPath
    : `/workspace/${toolPath.replace(/^\//, '')}`;

  const existing: { label: string; path: string }[] = JSON.parse(
    localStorage.getItem('recentTools') || '[]'
  );
  const updated = [
    { label: toolName, path: correctedPath },
    ...existing.filter((t) => t.path !== correctedPath),
  ].slice(0, 5);
  localStorage.setItem('recentTools', JSON.stringify(updated));
};



export const AppsSideNav: React.FC<{ categories: TAppCategory[] }> = ({
  categories,
}) => {
  type MenuItem = Required<MenuProps>['items'][number] & { priority: number };

  function getItem(
    label: React.ReactNode,
    key: string,
    priority: number,
    children?: MenuItem[],
    type?: 'group'
  ): MenuItem {
    return {
      label,
      key,
      priority,
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
                to={`/workspace/${app.app_id}${
                  app.version ? `?appVersion=${app.version}` : ''
                }`}
                onClick={() =>
                  handleToolClick(
                    app.shortLabel || app.label || app.bundle_label,
                    `/workspace/${app.app_id}${
                      app.version ? `?appVersion=${app.version}` : ''
                    }`
                  )
                }
              >
                {app.shortLabel || app.label || app.bundle_label}
              </NavLink>,

              `${app.app_id}${app.version}${app.bundle_id}`,
              app.priority
            )
          );
        } else {
          bundles[bundleKey] = {
            apps: [
              getItem(
                <NavLink
                  to={`/workspace/${app.app_id}${
                    app.version ? `?appVersion=${app.version}` : ''
                  }`}
                  onClick={() =>
                    handleToolClick(
                      app.shortLabel || app.label || app.bundle_label,
                      `/workspace/${app.app_id}${
                        app.version ? `?appVersion=${app.version}` : ''
                      }`
                    )
                  }
                >
                  {app.shortLabel || app.label || app.bundle_label}
                </NavLink>,

                `${app.app_id}${app.version}${app.bundle_id}`,
                app.priority
              ),
            ],
            label: app.bundle_label,
          };
        }
      } else {
        categoryItems.push(
          getItem(
            <NavLink
              to={`/workspace/${app.app_id}${
                app.version ? `?appVersion=${app.version}` : ''
              }`}
              onClick={() =>
                handleToolClick(
                  app.shortLabel || app.label || app.bundle_label,
                  `/workspace/${app.app_id}${
                    app.version ? `?appVersion=${app.version}` : ''
                  }`
                )
              }
            >
              {app.shortLabel || app.label || app.bundle_label}
            </NavLink>,

            `${app.app_id}${app.version}${app.bundle_id}`,
            app.priority
          )
        );
      }
    });
    const bundleItems = Object.entries(bundles).map(
      ([bundleKey, bundle], index) =>
        getItem(
          `${bundle.label} [${bundle.apps.length}]`,
          bundleKey,
          index,
          bundle.apps.sort((a, b) => a.priority - b.priority)
        )
    );

    return categoryItems
      .concat(bundleItems)
      .sort((a, b) => (a?.key as string).localeCompare(b?.key as string));
  };

  const items: MenuItem[] = categories.map((category) => {
    return getItem(
      `${category.title} [${category.apps.length}]`,
      category.title,
      category.priority,
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
    ? `${currentApp.bundle_label}${currentApp.bundle_id}`
    : '';
  const selectedKey = `${appId}${appVersion || ''}${currentApp?.bundle_id}`;

  return (
    <>
      <div
        style={{
          display: 'grid',
          justifyContent: 'center',
          padding: 10,
          fontWeight: 700,
          borderRight: '1px solid var(--global-color-primary--normal)',
        }}
      >
        Applications:
      </div>
      <Menu
        mode="inline"
        defaultOpenKeys={[
          (currentCategory as TAppCategory)?.title,
          currentSubMenu,
        ]}
        selectedKeys={[selectedKey]}
        items={items}
        inlineIndent={10}
      />
    </>
  );
};
