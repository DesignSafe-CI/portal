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
              window.location.href = tool.path;
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
