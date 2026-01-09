import React, { useEffect, useState } from 'react';
import { List, Typography } from 'antd';
import styles from '../Dashboard/Dashboard.module.css';

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
      <List
        size="small"
        bordered
        dataSource={recentTools}
        renderItem={(tool) => (
          <List.Item
            style={{ cursor: 'pointer' }}
            onClick={() => {
              window.location.href = tool.path;
            }}
          >
            <Typography.Link>{tool.label}</Typography.Link>
          </List.Item>
        )}
      />
    </div>
  );
};

export default RecentlyAccessed;
