import React, { useEffect, useState } from 'react';
import { Menu, MenuProps, Switch } from 'antd';
import { NavLink } from 'react-router-dom';
import { TAppCategory, TPortalApp } from '@client/hooks';
import { useGetAppParams } from '../utils';
import { getUserFavorites, addFavorite, removeFavorite } from '@client/hooks';

export const AppsSideNav: React.FC<{ categories: TAppCategory[] }> = ({
  categories,
}) => {
  const [favoriteToolIds, setFavoriteToolIds] = useState<string[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [updatingToolIds, setUpdatingToolIds] = useState<Set<string>>(
    new Set()
  );
  const { appId, appVersion } = useGetAppParams();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const favs = await getUserFavorites();
        const toolIds = (favs || []).map(
          (fav: { tool_id: string }) => fav.tool_id
        );
        console.log(':white_check_mark: Loaded favorite tool IDs:', toolIds);
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
    const isFavorite = favoriteToolIds.includes(toolId);
    const prevFavorites = [...favoriteToolIds];
    setFavoriteToolIds((prev) =>
      isFavorite ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
    setUpdatingToolIds((prev) => new Set(prev).add(toolId));
    try {
      if (isFavorite) {
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

  const getCategoryApps = (category: TAppCategory): MenuItem[] => {
    const bundles: Record<string, { apps: MenuItem[]; label: string }> = {};
    const categoryItems: MenuItem[] = [];
    category.apps.forEach((app) => {
      const toolId = app.version ? `${app.app_id}-${app.version}` : app.app_id;
      const isFavorite = favoriteToolIds.includes(toolId);
      console.log(
        `:jigsaw: App: ${app.app_id}, Version: ${app.version}, ToolID: ${toolId}, IsFavorite: ${isFavorite}`
      );
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
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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

  if (loadingFavorites) {
    return <div style={{ padding: 16 }}>Loading tools...</div>;
  }

  return (
    <>
      <div style={{ width: 280 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
            padding: 10,
            fontWeight: 700,
            borderRight: '1px solid var(--global-color-primary--normal)',
          }}
        >
          <i className="fa fa-th-large" aria-hidden="true" />
          <span>Applications:</span>
        </div>
        <Menu
          mode="inline"
          defaultOpenKeys={[currentCategory?.title || '', currentSubMenu || '']}
          selectedKeys={[selectedKey]}
          items={items}
          inlineIndent={10}
          style={{ height: '100%', fontSize: '10px' }}
        />
      </div>
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
