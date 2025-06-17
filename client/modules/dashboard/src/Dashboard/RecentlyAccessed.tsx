import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';

type RecentTool = {
  label: string;
  path: string;
};

const RecentlyAccessed: React.FC = () => {
  const [recentTools, setRecentTools] = useState<RecentTool[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentTools');
    if (stored) {
      try {
        const parsed: RecentTool[] = JSON.parse(stored);
        setRecentTools(parsed);
      } catch (e) {
        console.error('Failed to parse recentTools:', e);
        setRecentTools([]);
      }
    }
  }, []);

  const normalizePath = (path: string) => {
    return path.startsWith('/workspace/')
      ? path
      : `/workspace/${path.replace(/^\//, '')}`;
  };

  if (recentTools.length === 0) return null;

  return (
    <div className={styles.recentContainer}>
      <h4 className={styles.recentHeading}>Recently Accessed</h4>
      <ul className={styles.recentList}>
        {recentTools.map((tool, index) => (
          <li
            key={index}
            className={styles.recentItem}
            onClick={() => {
              const fullPath = normalizePath(tool.path);
              window.location.href = fullPath; // Full page reload
            }}
          >
            {tool.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentlyAccessed;
