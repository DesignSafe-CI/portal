import { Button, Form, Input, Select, Collapse } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as dropdownOptions from '../../projects/forms/ProjectFormDropdowns';

const { Panel } = Collapse;

export const PublicationSearchToolbar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showTips, setShowTips] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedSearches = JSON.parse(
      localStorage.getItem('recentSearches') || '[]'
    );
    setRecentSearches(storedSearches);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target as Node)
      ) {
        setShowTips(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateRecentSearches = (newSearch: string) => {
    const updatedSearches = [
      newSearch,
      ...recentSearches.filter((s) => s !== newSearch),
    ].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const removeSearchTerm = (term: string) => {
    const updatedSearches = recentSearches.filter((s) => s !== term);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const setSearchParam = (key: string, value?: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set(key, value);
      updateRecentSearches(value);
      setShowTips(false);
    } else {
      newSearchParams.delete(key);
    }
    if (key === 'facility') {
      newSearchParams.delete('experiment-type');
    }
    setSearchParams(newSearchParams);
  };

  const currentYear = new Date().getFullYear();
  // Show events going back to 2015
  const datesInRange = [];
  for (let i = currentYear; i >= 2015; i--) {
    datesInRange.push(i);
  }
  const yearOptions = datesInRange.map((y) => ({ label: y, value: y }));

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
        onFinish={(data) => setSearchParam('q', data.query)}
        style={{ display: 'inline-flex', flex: 1, minWidth: '250px' }}
      >
        <Button htmlType="submit" type="primary" className="success-button">
          <i className="fa fa-search" /> &nbsp;Search
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
        <Collapse
          bordered={false}
          defaultActiveKey={['1', '2']}
          style={{ width: '100%' }}
        >
          <Panel header="Search Tips" key="1">
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
          <Panel header="Recent Searches" key="2">
            {recentSearches.length ? (
              recentSearches.map((term, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <p
                    style={{ cursor: 'pointer', color: 'blue', margin: 0 }}
                    onClick={() => setSearchParam('q', term)}
                  >
                    {term}
                  </p>
                  <CloseOutlined
                    style={{
                      marginLeft: '8px',
                      color: 'red',
                      cursor: 'pointer',
                    }}
                    onClick={() => removeSearchTerm(term)}
                  />
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
