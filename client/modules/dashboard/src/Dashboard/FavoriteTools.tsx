import React, { useState, useRef, useEffect } from 'react';
import { useFavorites, useRemoveFavorite, useAppsListing } from '@client/hooks';
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
  const parts = toolId.split('-');
  if (parts.length > 1) {
    const versionPart = parts[parts.length - 1];
    if (/^\d+(\.\d+)*$/.test(versionPart)) {
      return {
        tool_id: parts.slice(0, -1).join('-'),
        version: versionPart,
      };
    }
  }
  return { tool_id: toolId };
};

const FavoriteTools = () => {
  const {
    data: favoritesData,
    isLoading: isLoadingFavorites,
    isError: isFavoritesError,
  } = useFavorites();
  const removeFavoriteMutation = useRemoveFavorite();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [showPanel, setShowPanel] = useState(false);
  const { data, isLoading, isError } = useAppsListing();

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setShowPanel(false);
      }
    };

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPanel]);

  const favorites = (favoritesData ?? []).map((fav) =>
    parseToolId(fav.tool_id)
  );

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

  const handleRemove = async (toolKey: string) => {
    if (removingIds.has(toolKey)) return;
    setRemovingIds((prev) => new Set(prev).add(toolKey));
    try {
      await removeFavoriteMutation.mutateAsync(toolKey);
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

  if (isLoadingFavorites || isLoading)
    return <div>Loading favorite tools...</div>;
  if (isFavoritesError || isError) return <div>Failed to load data.</div>;

  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        type="button"
        className={styles.favoriteToggle}
      >
        Favorites
      </button>

      {showPanel && (
        <div ref={panelRef} className={styles.favoritePanel}>
          <h4>Your Favorite Tools</h4>

          {resolvedFavorites.length === 0 ? (
            <div className={styles.emptyFavorites}>No favorite tools yet.</div>
          ) : (
            <ul className={styles.favoriteList}>
              {resolvedFavorites.map((tool) => (
                <li className={styles.favoriteItem} key={tool.key}>
                  <span
                    role="link"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToolClick(tool.label, tool.href);
                      window.open(tool.href, '_blank', 'noopener,noreferrer');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleToolClick(tool.label, tool.href);
                        window.open(tool.href, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className={styles.projectLink}
                  >
                    {tool.label}
                  </span>
                  <button
                    onClick={() => handleRemove(tool.key)}
                    disabled={removingIds.has(tool.key)}
                    type="button"
                    className={styles.starIcon}
                    aria-label={`Remove favorite ${tool.label}`}
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
