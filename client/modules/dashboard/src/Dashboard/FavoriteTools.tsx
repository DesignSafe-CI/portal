import React, { useState } from 'react';
import { Typography, List, Button } from 'antd';
import { useFavorites, useRemoveFavorite, useAppsListing } from '@client/hooks';
import type { TPortalApp } from '@client/hooks';

const { Link, Text } = Typography;

interface Favorite {
  app_id: string;
  version?: string;
  id: string;
}

interface RecentTool {
  label: string;
  path: string;
}

const parseToolId = (tool_id: string): { app_id: string; version?: string } => {
  const parts = tool_id.split('-');
  if (parts.length > 1 && /^\d+(\.\d+)*$/.test(parts[parts.length - 1])) {
    return {
      app_id: parts.slice(0, -1).join('-'),
      version: parts[parts.length - 1],
    };
  }
  return { app_id: tool_id };
};

const makeFavoriteKey = (fav: Favorite) =>
  fav.version ? `${fav.app_id}-${fav.version}` : fav.app_id;

const QuickLinksMenu: React.FC = () => {
  const [showFavorites, setShowFavorites] = useState(false);
  const { data: favoritesData, isLoading: loadingFavs } = useFavorites();
  const { data: appsData, isLoading: loadingApps } = useAppsListing();
  const removeFavoriteMutation = useRemoveFavorite();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  if (loadingFavs || loadingApps) return <div>Loading favorites...</div>;

  const allApps: TPortalApp[] =
    appsData?.categories.flatMap((cat) => cat.apps) ?? [];

  const favorites: Favorite[] = (favoritesData ?? []).map((fav) => {
    const { app_id, version } = parseToolId(fav.tool_id);
    return { app_id, version, id: fav.tool_id };
  });

  const resolvedFavorites = favorites
    .map((fav) => {
      const matchedApp = allApps.find(
        (app) =>
          app.app_id === fav.app_id &&
          (!fav.version || app.version === fav.version)
      );
      if (!matchedApp) return null;
      return {
        key: makeFavoriteKey(fav),
        app: matchedApp,
        id: fav.id,
      };
    })
    .filter(Boolean) as { key: string; app: TPortalApp; id: string }[];

  const handleRemove = async (key: string) => {
    if (removingIds.has(key)) return;

    setRemovingIds((prev) => new Set(prev).add(key));

    try {
      await removeFavoriteMutation.mutateAsync(key);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    } finally {
      setRemovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const handleToolClick = (app: TPortalApp) => {
    const href = app.version
      ? `/workspace/${app.app_id}?appVersion=${app.version}`
      : `/workspace/${app.app_id}`;

    const recent: RecentTool[] = JSON.parse(
      localStorage.getItem('recentTools') ?? '[]'
    );
    const updated = [
      { label: app.label, path: href },
      ...recent.filter((r) => r.path !== href),
    ].slice(0, 5);
    localStorage.setItem('recentTools', JSON.stringify(updated));

    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <nav>
      <div style={{ marginBottom: 8 }}>
        <Link
          onClick={() => setShowFavorites((v) => !v)}
          style={{ fontWeight: 'bold', cursor: 'pointer' }}
          aria-expanded={showFavorites}
          aria-controls="favorite-apps-list"
        >
          Favorite Apps
        </Link>
      </div>

      {showFavorites && (
        <div id="favorite-apps-list" style={{ marginBottom: 16 }}>
          {resolvedFavorites.length === 0 ? (
            <Text type="secondary">No favorite tools yet.</Text>
          ) : (
            <List
              size="small"
              dataSource={resolvedFavorites}
              bordered
              style={{ background: '#fff' }}
              renderItem={({ app, key }) => (
                <List.Item
                  key={key}
                  actions={[
                    <Button
                      type="text"
                      loading={removingIds.has(key)}
                      onClick={() => handleRemove(key)}
                      aria-label={`Remove favorite ${app.label}`}
                      style={{ color: '#FAAD14' }}
                    >
                      ★
                    </Button>,
                  ]}
                >
                  <Link
                    onClick={() => handleToolClick(app)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleToolClick(app);
                    }}
                  >
                    {app.label}
                  </Link>
                </List.Item>
              )}
            />
          )}
        </div>
      )}
    </nav>
  );
};

export default QuickLinksMenu;
