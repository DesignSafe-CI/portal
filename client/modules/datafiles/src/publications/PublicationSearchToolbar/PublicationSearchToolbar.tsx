import { Button, Form, Input, Collapse } from 'antd';
import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSyncExternalStore } from 'react';

const { Panel } = Collapse;

// Module-level cache to ensure stable snapshots
let lastSnapshot: string[] = [];

// Subscribe to external changes (storage events)
const subscribe = (callback: () => void) => {
  const handler = (event: StorageEvent) => {
    if (event.key === 'recentSearches') {
      callback();
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
};

// Get a stable snapshot of recent searches
const getRecentSearches = (): string[] => {
  let raw: string[];
  try {
    raw = JSON.parse(localStorage.getItem('recentSearches') || '[]');
  } catch {
    raw = [];
  }
  // Return cached snapshot if identical
  if (
    raw.length === lastSnapshot.length &&
    raw.every((v, i) => v === lastSnapshot[i])
  ) {
    return lastSnapshot;
  }
  // Update cache and return new snapshot
  lastSnapshot = raw;
  return raw;
};

export const PublicationSearchToolbar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTips, setShowTips] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Sync recentSearches across tabs
  const recentSearches = useSyncExternalStore(subscribe, getRecentSearches);

  const updateRecentSearches = (newSearch: string) => {
    const current = getRecentSearches();
    if (current[0] === newSearch) return;
    const updated = [newSearch, ...current.filter(s => s !== newSearch)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const setSearchParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
      updateRecentSearches(value);
      setShowTips(false);
    } else {
      params.delete(key);
    }
    if (key === 'facility') params.delete('experiment-type');
    setSearchParams(params);
  };

  return (
    <div
      ref={searchBarRef}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}
    >
      <Form onFinish={({ query }) => setSearchParam('q', query)} style={{ display: 'inline-flex', flex: 1, minWidth: '250px' }}>
        <Button htmlType="submit" type="primary" className="success-button">
          <i className="fa fa-search" />&nbsp;Search
        </Button>
        <Form.Item name="query" style={{ marginBottom: 0, flex: 1 }}>
          <Input
            placeholder="Author, Title, Keyword, Description, Natural Hazard Event, or Project ID"
            style={{ flex: 1 }}
            onFocus={() => setShowTips(true)}
            autoComplete="off"
          />
        </Form.Item>
      </Form>

      {showTips && (
        <Collapse bordered={false} defaultActiveKey={["1", "2"]} style={{ width: '100%' }}>
          <Panel header="Search Tips" key="1">
            <p><strong>"exact phrase"</strong> - Use quotes to search for exact phrases.</p>
            <p><strong>word1 OR word2</strong> - Find results containing either word.</p>
            <p><strong>word1 AND word2, word3 word4</strong> - Use AND, commas, and spaces to find results containing each word.</p>
          </Panel>
          <Panel header="Recent Searches" key="2">
            {recentSearches.length ? (
              recentSearches.map((term, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ cursor: 'pointer', color: '#337ab7', margin: 0 }} onClick={() => setSearchParam('q', term)}>
                    {term}
                  </p>
                </div>
              ))
            ) : (
              <p>No recent searches</p>
            )}
          </Panel>
        </Collapse>
      )}
    </div>
  );
};
