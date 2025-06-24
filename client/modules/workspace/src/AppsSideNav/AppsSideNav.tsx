import React, { useEffect, useState } from 'react';
import { Menu, MenuProps, Switch } from 'antd';
import { NavLink } from 'react-router-dom';
import { TAppCategory, TPortalApp } from '@client/hooks';
import { useGetAppParams } from '../utils';
import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
} from '../../../dashboard/src/api/favouritesApi';

export const AppsSideNav: React.FC<{ categories: TAppCategory[] }> = ({ categories }) => {
  const [favoriteToolIds, setFavoriteToolIds] = useState<string[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [updatingToolIds, setUpdatingToolIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const favs = await getUserFavorites();
        const toolIds = (favs || []).map((fav: { tool_id: string; version?: string }) =>
          fav.tool_id + (fav.version || '')
        );
        setFavoriteToolIds(toolIds);
      } catch (err) {
        console.error('Failed to load favorites', err);
      } finally {
        setLoadingFavorites(false);
      }
    };
    fetchFavorites();
  }, []);

  const handleStarClick = async (toolId: string) => {
    const isCurrentlyFavorite = favoriteToolIds.includes(toolId);
    const prevFavorites = [...favoriteToolIds];
    const updatedFavorites = isCurrentlyFavorite
      ? favoriteToolIds.filter((id) => id !== toolId)
      : [...favoriteToolIds, toolId];

    setFavoriteToolIds(updatedFavorites);
    setUpdatingToolIds((prev) => new Set(prev).add(toolId));

    try {
      if (isCurrentlyFavorite) {
        await removeFavorite(toolId);
      } else {
        await addFavorite(toolId);
      }
    } catch (err) {
      console.error('Failed to update favorites', err);
      setFavoriteToolIds(prevFavorites);
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

  const getCategoryApps = (category: TAppCategory) => {
    const bundles: Record<string, { apps: MenuItem[]; label: string }> = {};
    const categoryItems: MenuItem[] = [];

    category.apps.forEach((app) => {
      const toolId = app.app_id + (app.version || '');
      const linkPath = `${app.app_id}${app.version ? `?appVersion=${app.version}` : ''}`;
      const linkLabel = app.shortLabel || app.label || app.bundle_label;
      const isFavorite = favoriteToolIds.includes(toolId);

      const switchControl = (
        <span
          onClick={(e) => e.stopPropagation()}
          style={{ marginLeft: 6, display: 'inline-block' }}
        >
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
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <NavLink
            to={linkPath}
            onClick={() => handleToolClick(linkLabel, linkPath)}
            style={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              outline: 'none',
            }}
          >
            {linkLabel}
          </NavLink>
          {switchControl}
        </span>
      );

      const item = getItem(labelContent, toolId, app.priority);

      if (app.is_bundled) {
        const bundleKey = `${app.bundle_label}${app.bundle_id}`;
        if (bundles[bundleKey]) {
          bundles[bundleKey].apps.push(item);
        } else {
          bundles[bundleKey] = {
            apps: [item],
            label: app.bundle_label,
          };
        }
      } else {
        categoryItems.push(item);
      }
    });

    const bundleItems = Object.entries(bundles).map(([bundleKey, bundle], index) =>
      getItem(
        `${bundle.label} [${bundle.apps.length}]`,
        bundleKey,
        index,
        bundle.apps.sort((a, b) => a.priority - b.priority)
      )
    );

    return [...categoryItems.sort((a, b) => a.priority - b.priority), ...bundleItems];
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

  const { appId, appVersion } = useGetAppParams();

  const currentApp = categories
    .flatMap((cat) => cat.apps)
    .find((app) => app.app_id === appId && app.version === (appVersion || ''));

  const currentCategory = categories.find((cat) =>
    cat.apps.includes(currentApp as TPortalApp)
  );

  const currentSubMenu = currentApp?.is_bundled
    ? `${currentApp.bundle_label}${currentApp.bundle_id}`
    : '';

  const selectedKey = `${appId}${appVersion || ''}${currentApp?.bundle_id ?? ''}`;

  if (loadingFavorites) return <div style={{ padding: 16 }}>Loading tools...</div>;

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
        style={{
          height: '100%',
        }}
      />
    </>
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
