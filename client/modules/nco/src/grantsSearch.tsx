import { Select, Input } from 'antd';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useNcoGrantsFacilityListing,
  useNcoGrantsHazardTypeListing,
  useNcoGrantsGrantTypeListing,
} from '@client/hooks';
import styles from './Nco.module.css';

export const NcoGrantsSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { Search } = Input;

  const facilities = useNcoGrantsFacilityListing().data?.response ?? [];
  const grants = useNcoGrantsGrantTypeListing().data?.response ?? [];
  const hazards = useNcoGrantsHazardTypeListing().data?.response ?? [];

  const setSearchParam = (key: string, value?: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set(key, value);
    } else {
      newSearchParams.delete(key);
    }
    setSearchParams(newSearchParams);
  };

  return (
    <>
      <div className={styles.filterRow}>
        <div className={styles.filterItem}>
          <label htmlFor="grants-facility-select">
            Filter by Facility/Group:
          </label>
          <Select
            id="grants-facility-select"
            style={{ width: '60%' }}
            virtual={false}
            value={searchParams.get('facility')}
            onChange={(v) => {
              setSearchParam('facility', v);
            }}
            options={[
              { label: 'All Facilities', value: null },
              ...facilities.map((facility) => ({
                value: facility,
                label: facility,
              })),
            ]}
            defaultValue="All Facilities"
          />
        </div>
        <div className={styles.filterItem}>
          <label htmlFor="grants-sort-select">Sort by:</label>
          <Select
            id="grants-sort-select"
            style={{ width: '50%' }}
            virtual={false}
            options={[
              { label: 'End Date Descending', value: 'End Date Descending' },
              { label: 'End Date Ascending', value: 'End Date Ascending' },
            ]}
            value={searchParams.get('sort')}
            onChange={(v) => {
              setSearchParam('sort', v);
            }}
            placeholder="End Date Descending"
          />
        </div>
      </div>
      <br />
      <div className={styles.filterRow}>
        <div className={styles.filterItem}>
          <label htmlFor="grants-grant-select">Select a Grant Type:</label>
          <Select
            id="grants-grant-select"
            style={{ width: '60%' }}
            virtual={false}
            options={[
              { label: 'All Types', value: null },
              ...grants.map((grant) => ({
                value: grant,
                label: grant,
              })),
            ]}
            value={searchParams.get('grant_type')}
            onChange={(v) => {
              setSearchParam('grant_type', v);
            }}
            defaultValue="All Types"
          />
        </div>
        <div className={styles.filterItem}>
          <label htmlFor="grants-hazard-select">Select a Hazard Type:</label>
          <Select
            id="grants-hazard-select"
            style={{ width: '60%' }}
            virtual={false}
            options={[
              { label: 'All Types', value: null },
              ...hazards.map((hazard) => ({
                value: hazard,
                label: hazard,
              })),
            ]}
            value={searchParams.get('hazard_type')}
            onChange={(v) => {
              setSearchParam('hazard_type', v);
            }}
            defaultValue="All Types"
          />
        </div>
      </div>
      <div className={styles.filterRow}>
        <div className={styles.filterItem}>
          <label>Search Title/Abstract/PI/Co-PI</label>
          <Search
            placeholder="Press enter to search"
            autoComplete="off"
            onSearch={(v) => setSearchParam('text_search', v)}
          />
        </div>
      </div>
    </>
  );
};
