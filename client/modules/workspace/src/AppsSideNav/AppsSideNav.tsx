import React, { useState } from 'react';
import { Menu, MenuProps, Switch } from 'antd';
import { NavLink } from 'react-router-dom';
import {
  TAppCategory,
  TPortalApp,
  useFavorites,
  useAddFavorite,
  useRemoveFavorite,
} from '@client/hooks';
import { useGetAppParams } from '../utils';

export const AppsSideNav: React.FC<{ categories: TAppCategory[] }> = ({
  categories,
}) => {
  const { data: favoritesData = [], isLoading: isLoadingFavorites } =
    useFavorites();
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();

  const [updatingToolIds, setUpdatingToolIds] = useState<Set<string>>(
    new Set()
  );
  const { appId, appVersion } = useGetAppParams();

  const favoriteToolIds = favoritesData.map((fav) => fav.tool_id);

  const handleStarClick = async (toolId: string) => {
    const isFavorite = favoriteToolIds.includes(toolId);
    setUpdatingToolIds((prev) => new Set(prev).add(toolId));

    try {
      if (isFavorite) {
        await removeFavoriteMutation.mutateAsync(toolId);
      } else {
        await addFavoriteMutation.mutateAsync(toolId);
      }
    } catch (err) {
      console.error('Failed to update favorites', err);
    } finally {
      setUpdatingToolIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(toolId);
        return newSet;
      });
    }
  };

  type MenuItem = Required<MenuProps>['items'][number] & { priority: number };

  const getItem = (
    label: React.ReactNode,
    key: string,
    priority: number,
    children?: MenuItem[],
    type?: 'group'
  ): MenuItem => ({
    label,
    key,
    priority,
    children,
    ...(type === 'group' ? { type } : {}),
  });

  const getCategoryApps = (category: TAppCategory): MenuItem[] => {
    const bundles: Record<string, { apps: MenuItem[]; label: string }> = {};
    const categoryItems: MenuItem[] = [];

    category.apps.forEach((app) => {
      const toolId = app.version ? `${app.app_id}-${app.version}` : app.app_id;
      const isFavorite = favoriteToolIds.includes(toolId);
      const linkPath = `${app.app_id}${
        app.version ? `?appVersion=${app.version}` : ''
      }`;
      const linkLabel = app.shortLabel || app.label || app.bundle_label;

      const switchControl = (
        <span onClick={(e) => e.stopPropagation()} style={{ marginLeft: 6 }}>
          <Switch
            checked={isFavorite}
            loading={updatingToolIds.has(toolId)}
            size="small"
            onChange={() => handleStarClick(toolId)}
            checkedChildren="★"
            unCheckedChildren="☆"
          />
        </span>
      );

      const labelContent = (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            gap: 8,
            paddingTop: 2,
            paddingBottom: 2,
            lineHeight: 1.2,
          }}
        >
          <NavLink
            to={linkPath}
            onClick={() => handleToolClick(linkLabel, linkPath)}
            style={{
              flex: 1,
              whiteSpace: 'normal',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            {linkLabel}
          </NavLink>
          {switchControl}
        </div>
      );

      const item = getItem(labelContent, toolId, app.priority);

      if (app.is_bundled) {
        const bundleKey = `${app.bundle_label}${app.bundle_id}`;
        if (!bundles[bundleKey]) {
          bundles[bundleKey] = { apps: [], label: app.bundle_label };
        }
        bundles[bundleKey].apps.push(item);
      } else {
        categoryItems.push(item);
      }
    });

    const bundleItems = Object.entries(bundles).map(
      ([bundleKey, bundle], idx) =>
        getItem(
          `${bundle.label} [${bundle.apps.length}]`,
          bundleKey,
          idx,
          bundle.apps.sort((a, b) => a.priority - b.priority)
        )
    );

    return [
      ...categoryItems.sort((a, b) => a.priority - b.priority),
      ...bundleItems,
    ];
  };

  const items: MenuItem[] = categories
    .map((category) =>
      getItem(
        `${category.title} [${category.apps.length}]`,
        category.title,
        category.priority,
        getCategoryApps(category)
      )
    )
    .sort((a, b) => a.priority - b.priority);

  const currentApp = categories
    .flatMap((cat) => cat.apps)
    .find((app) => app.app_id === appId && app.version === (appVersion || ''));

  const currentCategory = categories.find((cat) =>
    cat.apps.includes(currentApp as TPortalApp)
  );

  const currentSubMenu = currentApp?.is_bundled
    ? `${currentApp.bundle_label}${currentApp.bundle_id}`
    : '';

  const selectedKey = appVersion ? `${appId}-${appVersion}` : appId;

  return (
    <div style={{ width: 220 }}>
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
        defaultOpenKeys={[currentCategory?.title || '', currentSubMenu || '']}
        selectedKeys={[selectedKey]}
        items={items}
        inlineIndent={10}
        style={{ height: '100%', fontSize: '14px' }}
      />
    </div>
  );
};

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
