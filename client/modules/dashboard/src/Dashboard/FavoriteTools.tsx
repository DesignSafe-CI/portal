import React, { useEffect, useState } from 'react';
import { getUserFavorites, removeFavorite } from '../api/favouritesApi';
import { useAppsListing } from '@client/hooks';
import styles from './Dashboard.module.css';

// Define your favorite tool shape (minimal)
interface FavoriteTool {
  id: string;
  version?: string;
}

// Define TPortalApp based on what the API returns
// Adjust fields as per your actual API shape
interface TPortalApp {
  app_id: string;
  version: string;
  id?: string;
  label?: string;
  // ...other fields your API returns
}

// Shape expected by your UI logic with a definition property
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

  // Fetch the full apps list from hook
  const { data, isLoading, isError } = useAppsListing();

  // Convert TPortalApp[] to AppData[] by adding definition property dynamically
const allApps: AppData[] = data?.categories?.flatMap(cat =>
  cat.apps.map(app => ({
    app_id: app.app_id,
    version: app.version || '',  // fallback if undefined
    definition: {
      id: app.app_id,            // Use app_id here because 'id' doesn't exist
      notes: {
        label: app.label,
      },
    },
  }))
) ?? [];



  // Map user favorites to resolved app info for display
  const resolvedFavorites = favorites
    .map((fav) => {
      const matchedApp = allApps.find(
        (app) =>
          app.app_id === fav.id && (!fav.version || app.version === fav.version)
      );

      if (!matchedApp) return null;

      const label =
        matchedApp.definition?.notes?.label || matchedApp.definition?.id;
      const href = `/apps/${matchedApp.definition.id}`;

      return {
        id: fav.id,
        label,
        href,
      };
    })
    .filter(Boolean) as { id: string; label: string; href: string }[];

  // Load favorites on mount
  useEffect(() => {
    async function fetchFavorites() {
      try {
        const data = await getUserFavorites();
        setFavorites(data);
      } catch (err) {
        console.error('Failed to load favorites:', err);
      }
    }
    fetchFavorites();
  }, []);

  // Remove favorite handler
  const handleRemove = async (toolId: string) => {
    try {
      await removeFavorite(toolId);
      setFavorites((prev) => prev.filter((tool) => tool.id !== toolId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
    }
  };

  if (isLoading) return <div>Loading favorite tools...</div>;
  if (isError) return <div>Failed to load apps data.</div>;

  return (
    <>
      {/* Floating star icon */}
      <button
        className={styles.favoriteToggle}
        onClick={() => setShowPanel(!showPanel)}
        aria-label="Toggle Favorites Panel"
        title="Toggle Favorites Panel"
      >
        ★
      </button>

      {/* Favorite tools panel */}
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
                    onClick={() => handleRemove(tool.id)}
                    title={`Remove ${tool.label}`}
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
