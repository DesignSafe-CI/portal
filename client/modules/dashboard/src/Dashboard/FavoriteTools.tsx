import React, { useEffect, useState } from 'react';
import { getUserFavorites, removeFavorite } from '../api/favouritesApi';
import { useAppsListing } from '@client/hooks';
import styles from './Dashboard.module.css';

interface FavoriteTool {
  tool_id: string;
  version?: string;
}

interface TPortalApp {
  app_id: string;
  version: string;
  id?: string;
  label?: string;
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

const FavoriteTools = () => {
  const [favorites, setFavorites] = useState<FavoriteTool[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  const { data, isLoading, isError } = useAppsListing();

  const allApps: AppData[] = data?.categories?.flatMap((cat) =>
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
      const href = `/apps/${matchedApp.definition.id}`;

      return {
        id: fav.tool_id,
        label,
        href,
      };
    })
    .filter(Boolean) as { id: string; label: string; href: string }[];

  useEffect(() => {
    async function fetchFavorites() {
      setIsLoadingFavorites(true);
      setFavoritesError(null);
      try {
        const data = await getUserFavorites();
        setFavorites(data);
      } catch (err) {
        console.error('Failed to load favorites:', err);
        setFavoritesError('Failed to load favorites.');
      } finally {
        setIsLoadingFavorites(false);
      }
    }
    fetchFavorites();
  }, []);

  const handleRemove = async (toolId: string) => {
    try {
      await removeFavorite(toolId);
      setFavorites((prev) =>
        prev.filter((tool) => tool.tool_id !== toolId)
      );
    } catch (err) {
      console.error('Failed to remove favorite:', err);
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
                <li key={tool.id} className={styles.favoriteItem}>
                  <a href={tool.href} target="_blank" rel="noreferrer">
                    {tool.label}
                  </a>
                  <span
                    className={styles.starIcon}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleRemove(tool.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRemove(tool.id);
                      }
                    }}
                    title={`Remove ${tool.label}`}
                    aria-label={`Remove ${tool.label} from favorites`}
                  >
                    ★
                  </span>
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
