import { Button, Form, Input, Collapse, Select } from 'antd';
import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSyncExternalStore } from 'react';
import * as dropdownOptions from '../../projects/forms/ProjectFormDropdowns';
import styles from './PublicationSearchToolbar.module.css'

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
  const searchHelpRef = useRef<HTMLDivElement>(null);

  // Sync recentSearches across tabs
  const recentSearches = useSyncExternalStore(subscribe, getRecentSearches);

  const updateRecentSearches = (newSearch: string) => {
    const current = getRecentSearches();
    if (current[0] === newSearch) return;
    const updated = [
      newSearch,
      ...current.filter((s) => s !== newSearch),
    ].slice(0, 5);
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

  const currentYear = new Date(Date.now()).getUTCFullYear();
  //Show events going back to 2015
  const datesInRange = [];
  for (let i = currentYear; i >= 2015; i--) {
    datesInRange.push(i);
  }
  const yearOptions = [...datesInRange.map((y) => ({ label: y, value: y }))];

  return (
    <div 
      ref={searchBarRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
      }}
    >
      <Form
        onFinish={({ query }) => setSearchParam('q', query)}
        style={{ display: 'inline-flex', flex: 1, minWidth: '250px' }}
      >
        <Button htmlType="submit" type="primary" className="success-button">
          <i className="fa fa-search" />
          &nbsp;Search
        </Button>
        <Form.Item name="query" style={{ marginBottom: 0, flex: 1 }}>
          <Input
            placeholder="Author, Title, Keyword, Description, Natural Hazard Event, or Project ID"
            style={{ flex: 1 }}
            onFocus={() => setShowTips(true)}
            onBlur={(evt) => {
              if (evt.relatedTarget !== searchHelpRef.current) {
                setShowTips(false);
              }
            }}
            autoComplete="off"
          />
        </Form.Item>
      </Form>

      {showTips && (
        <div style={{ width: '100%' }} tabIndex={0} ref={searchHelpRef}>
          <Collapse
            bordered={false}
            defaultActiveKey={['1', '2']}
            expandIconPosition="end"
            collapsible="icon"
            style={{ width: '100%' }}
          >
            <Panel
              header={<strong>Search Tips</strong>}
              key="1"
              showArrow={false}
            >
              <p>
                <strong>"exact phrase"</strong> - Use quotes to search for exact
                phrases.
              </p>
              <p>
                <strong>word1 OR word2</strong> - Find results containing either
                word.
              </p>
              <p>
                <strong>word1 AND word2, word3 word4</strong> - Use AND, commas,
                and spaces to find results containing each word.
              </p>
            </Panel>
            <Panel
              header={<strong>Recent Searches</strong>}
              key="2"
              showArrow={false}
            >
              {recentSearches.length ? (
                recentSearches.map((term, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <i
                      role="none"
                      className="fa fa-search"
                      style={{ color: '#337ab7' }}
                    />
                    <p
                      style={{ cursor: 'pointer', color: '#337ab7', margin: 0 }}
                      onClick={() => setSearchParam('q', term)}
                    >
                      {term}
                    </p>
                  </div>
                ))
              ) : (
                <p>No recent searches</p>
              )}
            </Panel>
          </Collapse>
        </div>
      )}
      <div>
        <label htmlFor="nh-type-select" style={{ margin: 0 }}>
          Natural Hazard Type
        </label>
        &nbsp;
        <Select
          style={{ width: '150px' }}
          virtual={false}
          allowClear
          id="nh-type-select"
          placeholder="All Types"
          options={[
            { label: 'All Types', value: null },
            ...dropdownOptions.nhTypeOptions,
          ]}
          popupMatchSelectWidth={false}
          value={searchParams.get('nh-type')}
          onChange={(v) => setSearchParam('nh-type', v)}
        />
      </div>

      <div>
        <label htmlFor="publication-year-select" style={{ margin: 0 }}>
          Year Published
        </label>
        &nbsp;
        <Select
          style={{ width: '150px' }}
          id="publication-year-select"
          options={[{ label: 'All Years', value: null }, ...yearOptions]}
          allowClear
          placeholder="All Years"
          popupMatchSelectWidth={false}
          virtual={false}
          value={searchParams.get('pub-year')}
          onChange={(v) => setSearchParam('pub-year', v)}
        />
      </div>

      <Button type="link" onClick={() => setSearchParams(undefined)}>
        Clear Filters
      </Button>
    </div>
  );
};
