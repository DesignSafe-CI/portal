import React, { useEffect, useState } from 'react';
import { getUserFavorites, removeFavorite } from '@client/common-components';
import { useAppsListing } from '@client/hooks';
import styles from './Dashboard.module.css';

interface FavoriteTool {
  tool_id: string;
  version?: string;
}

interface AppData {
  app_id: string;
  version: string;
  definition: {
    id: string;
    notes?: {
      label?: string;
    };
  };
}

const makeToolKey = (tool_id: string, version?: string) =>
  version ? `${tool_id}-${version}` : tool_id;

const parseToolId = (toolId: string): FavoriteTool => {
  const versionMatch = toolId.match(/(native|s|ds)?\d+(\.\d+)+$/);
  if (!versionMatch) return { tool_id: toolId };
  const version = versionMatch[0];
  const tool_id = toolId.slice(0, -version.length).replace(/-$/, '');
  return { tool_id, version };
};

const FavoriteTools = () => {
  const [favorites, setFavorites] = useState<FavoriteTool[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const { data, isLoading, isError } = useAppsListing();

  const allApps: AppData[] =
    data?.categories?.flatMap((cat) =>
      cat.apps.map((app) => ({
        app_id: app.app_id,
        version: app.version || '',
        definition: {
          id: app.app_id,
          notes: {
            label: app.label,
          },
        },
      }))
    ) ?? [];

  const resolvedFavorites = favorites
    .map((fav) => {
      const matchedApp = allApps.find(
        (app) =>
          app.app_id === fav.tool_id &&
          (!fav.version || app.version === fav.version)
      );
      if (!matchedApp) return null;

      const label =
        matchedApp.definition?.notes?.label || matchedApp.definition.id;

      // 🚨 use `/workspace/` instead of `/apps/`
      const href = matchedApp.version
        ? `/workspace/${matchedApp.definition.id}?appVersion=${matchedApp.version}`
        : `/workspace/${matchedApp.definition.id}`;

      return {
        key: makeToolKey(fav.tool_id, fav.version),
        id: fav.tool_id,
        version: fav.version,
        label,
        href,
      };
    })
    .filter(Boolean) as {
    key: string;
    id: string;
    version?: string;
    label: string;
    href: string;
  }[];

  useEffect(() => {
    async function fetchFavorites() {
      setIsLoadingFavorites(true);
      setFavoritesError(null);
      try {
        const data = await getUserFavorites();
        const parsedFavorites = data.map((fav) => parseToolId(fav.tool_id));
        setFavorites(parsedFavorites);
      } catch (err) {
        console.error('Failed to load favorites:', err);
        setFavoritesError('Failed to load favorites.');
      } finally {
        setIsLoadingFavorites(false);
      }
    }
    fetchFavorites();
  }, []);

  const handleRemove = async (toolKey: string) => {
    if (removingIds.has(toolKey)) return;
    setRemovingIds((prev) => new Set(prev).add(toolKey));
    try {
      await removeFavorite(toolKey);
      setFavorites((prev) =>
        prev.filter(
          (tool) => makeToolKey(tool.tool_id, tool.version) !== toolKey
        )
      );
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    } finally {
      setRemovingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(toolKey);
        return newSet;
      });
    }
  };

  if (isLoadingFavorites) return <div>Loading favorite tools...</div>;
  if (favoritesError) return <div>{favoritesError}</div>;
  if (isLoading) return <div>Loading apps data...</div>;
  if (isError) return <div>Failed to load apps data.</div>;

  return (
    <>
      <button
        className={styles.favoriteToggle}
        onClick={() => setShowPanel(!showPanel)}
        aria-label="Toggle Favorites Panel"
        title="Toggle Favorites Panel"
      >
        ★
      </button>
      {showPanel && (
        <div className={styles.favoritePanel}>
          <h4>Your Favorite Tools</h4>
          {resolvedFavorites.length === 0 ? (
            <p>No favorite tools yet.</p>
          ) : (
            <ul className={styles.favoriteList}>
              {resolvedFavorites.map((tool) => (
                <li key={tool.key} className={styles.favoriteItem}>
                  <a href={tool.href} target="_blank" rel="noreferrer">
                    {tool.label}
                  </a>
                  <button
                    className={styles.starIcon}
                    onClick={() => handleRemove(tool.key)}
                    disabled={removingIds.has(tool.key)}
                    aria-label={`Remove ${tool.label} from favorites`}
                    title={`Remove ${tool.label}`}
                    type="button"
                  >
                    ★
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
};

export default FavoriteTools;
