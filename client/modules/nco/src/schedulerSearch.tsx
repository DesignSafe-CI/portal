import { Select } from 'antd';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNcoSchedFacilityListing } from '@client/hooks';
import styles from './Nco.module.css';

export const NcoSchedSearch: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const { data } = useNcoSchedFacilityListing();
    const facilityArray = data?.response ?? [];

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
        <div className={styles.filterRow}>
            <div className={styles.filterItem}>
                <label htmlFor='sched-facility-select'>
                    Filters:
                </label>
                <Select
                    id="sched-facility-select"
                    style={{ width: '80%' }}
                    virtual={false}
                    value={searchParams.get('facility')}
                    onChange={(v) => {
                        setSearchParam('facility', v);
                    }}
                    options={[
                        { label: 'Filter by Facility', value: null },
                        ...facilityArray.map((facility) => ({
                            value: facility,
                            label: facility
                        })),
                    ]}  
                    placeholder='Filter by Facility'
                />
            </div>
            <div className={styles.filterItem}>
                <Select
                    style={{ width: '80%' }}
                    virtual={false}
                    options={[
                        { label: 'Current Events', value: 'Current Events'},
                        { label: 'All Events', value: 'All Events'},
                    ]}
                    value={searchParams.get('history')}
                    onChange={(v) => {
                        setSearchParam('history', v);
                    }}
                    placeholder='Current Events'
                />
            </div>
            <div className={styles.filterItem}>
                <label htmlFor='sched-sort-select'>
                    Sort by:
                </label>
                <Select
                    id="sched-sort-select"
                    style={{ width: '80%' }}
                    virtual={false}
                    options={[
                        { label: 'Select a sorting option', value: null},
                        { label: 'Start Date - newest first', value: 'Start Date - newest first' },
                        { label: 'Start Date - oldest first', value: 'Start Date - oldest first' },
                        { label: 'Award Number', value: 'Award Number' },
                        { label: 'Facility', value: 'Facility' },
                        { label: 'PI Name', value: 'PI Name' },
                    ]}
                    value={searchParams.get('sort')}
                    onChange={(v) => {
                        setSearchParam('sort', v);
                    }}
                    placeholder="Start Date - oldest first"
                />
            </div>
        </div>
    );
}