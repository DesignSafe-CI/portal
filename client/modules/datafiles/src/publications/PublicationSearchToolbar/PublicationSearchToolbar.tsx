import { Button, Form, Input, Collapse, Select } from 'antd';
import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSyncExternalStore } from 'react';
import * as dropdownOptions from '../../projects/forms/ProjectFormDropdowns';
import styles from './PublicationSearchToolbar.module.css';

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
  const [form] = Form.useForm();
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

  const handleClearFilters = () => {
    setSearchParams({});
    form.resetFields();
    setShowTips(false);
  };

  // Hide tips when clicking outside the panel
  React.useEffect(() => {
    const handleClick = (event: Event) => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
        setShowTips(false);
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [searchBarRef, setShowTips]);

  const currentYear = new Date(Date.now()).getUTCFullYear();
  //Show events going back to 2015
  const datesInRange = [];
  for (let i = currentYear; i >= 2015; i--) {
    datesInRange.push(i);
  }
  const yearOptions = [...datesInRange.map((y) => ({ label: y, value: y }))];

  return (
    <div ref={searchBarRef} className={styles.toolbar}>
      <div className={styles.searchWrapper}>
        <Form
          form={form}
          onFinish={({ query }) => setSearchParam('q', query)}
          className={styles.searchForm}
        >
          <Button htmlType="submit" type="primary" className="success-button">
            <i className="fa fa-search" />
            &nbsp;Search
          </Button>
          <Form.Item name="query" className={styles.searchInputItem}>
            <Input
              placeholder="Author, Title, Keyword, Description, Natural Hazard Event, or Project ID"
              className={styles.searchInput}
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
          <div ref={searchHelpRef} tabIndex={0} className={styles.searchTips}>
            <Collapse
              bordered={false}
              defaultActiveKey={['1', '2']}
              expandIconPosition="end"
              collapsible="icon"
              className={styles.collapsePanel}
            >
              <Panel
                header={<strong>Search Tips</strong>}
                key="1"
                showArrow={false}
              >
                <p>
                  <strong>"exact phrase"</strong> - Use quotes to search for
                  exact phrases.
                </p>
                <p>
                  <strong>word1 OR word2</strong> - Find results containing
                  either word.
                </p>
                <p>
                  <strong>word1 AND word2, word3 word4</strong> - Use AND,
                  commas, and spaces to find results containing each word.
                </p>
              </Panel>
              <Panel
                header={<strong>Recent Searches</strong>}
                key="2"
                showArrow={false}
              >
                {recentSearches.length ? (
                  recentSearches.map((term, idx) => (
                    <div key={idx} className={styles.recentItem}>
                      <i className={`fa fa-search ${styles.recentIcon}`} />
                      <p
                        className={styles.recentText}
                        onClick={() => {
                          setSearchParam('q', term);
                          form.setFieldsValue({ query: term });
                          form.submit();
                        }}
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
      </div>
      <div>
        <label htmlFor="nh-type-select" className={styles.filterLabel}>
          Natural Hazard Type
        </label>
        &nbsp;
        <Select
          className={styles.filterSelect}
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
        <label htmlFor="publication-year-select" className={styles.filterLabel}>
          Year Published
        </label>
        &nbsp;
        <Select
          className={styles.filterSelect}
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

      <Button type="link" onClick={handleClearFilters}>
        Clear Filters
      </Button>
    </div>
  );
};
