import { Checkbox, Select } from 'antd';
import React from 'react';
import * as dropdownOptions from '../../projects/forms/ProjectFormDropdowns';
import styles from './PublicationSearchSidebar.module.css';
import { useSearchParams } from 'react-router-dom';
export const PublicationSearchSidebar: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const toggleProjectTypeFilter = (projectType: string) => {
    const selectedTypes = searchParams.getAll('project-type');
    const newSearchParams = new URLSearchParams(searchParams);

    if (selectedTypes.includes(projectType)) {
      newSearchParams.delete('project-type', projectType);
      setSearchParams(newSearchParams, { replace: true });
    } else {
      newSearchParams.append('project-type', projectType);
      setSearchParams(newSearchParams, { replace: true });
    }
  };

  const setSearchParam = (key: string, value?: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (value) {
      newSearchParams.set(key, value);
    } else {
      newSearchParams.delete(key);
    }
    if (key === 'facility') {
      newSearchParams.delete('experiment-type');
    }
    setSearchParams(newSearchParams);
  };

  const currentYear = new Date(Date.now()).getUTCFullYear();
  //Show events going back to 2015
  const datesInRange = [];
  for (let i = currentYear; i >= 2015; i--) {
    datesInRange.push(i);
  }
  const yearOptions = datesInRange.map((y) => ({ label: y, value: y }));

  return (
    <section style={{ backgroundColor: '#fafafa' }}>
      <article className={styles.projectTypeOptions}>
        <label htmlFor="facility-select">Facility</label>

        <Select
          id="facility-select"
          allowClear
          virtual={false}
          value={searchParams.get('facility')}
          onChange={(v) => {
            setSearchParam('facility', v);
          }}
          options={[
            { label: 'All Facilities', value: null },
            ...dropdownOptions.facilityOptions,
          ]}
          popupMatchSelectWidth={false}
          style={{ width: '100%' }}
          placeholder="All Facilities"
        />
      </article>

      <article className={styles.projectTypeOptions}>
        <div className={styles.checkboxRow}>
          <Checkbox
            checked={searchParams
              .getAll('project-type')
              .includes('experimental')}
            onChange={() => toggleProjectTypeFilter('experimental')}
          />
          &nbsp;
          <strong>Experimental</strong>
        </div>
        <div>
          <label
            className={styles.sidebarLabel}
            htmlFor="experiment-type-select"
          >
            Experiment Type
          </label>
          <Select
            id="experiment-type-select"
            virtual={false}
            allowClear
            disabled={
              !Object.keys(dropdownOptions.experimentTypeOptions).includes(
                searchParams.get('facility') ?? ''
              )
            }
            value={searchParams.get('experiment-type')}
            onChange={(v) => setSearchParam('experiment-type', v)}
            options={
              searchParams.get('experimentType')
                ? [
                    { label: 'All Types', value: null },
                    ...dropdownOptions.experimentTypeOptions[
                      searchParams.get('experimentType') ?? ''
                    ],
                  ]
                : []
            }
            style={{ width: '100%' }}
            placeholder="All Types"
          />
        </div>
      </article>
      <article className={styles.projectTypeOptions}>
        <div className={styles.checkboxRow}>
          <Checkbox
            checked={searchParams.getAll('project-type').includes('simulation')}
            onChange={() => toggleProjectTypeFilter('simulation')}
          />
          &nbsp;
          <strong>Simulation</strong>
        </div>
        <label className={styles.sidebarLabel} htmlFor="simulation-type-select">
          Simulation Type
        </label>

        <Select
          id="simulation-type-select"
          options={[
            { label: 'All Types', value: null },
            ...dropdownOptions.simulationTypeOptions,
          ]}
          value={searchParams.get('sim-type')}
          onChange={(v) => setSearchParam('sim-type', v)}
          allowClear
          style={{ width: '100%' }}
          placeholder="All Types"
        />
      </article>
      <article className={styles.projectTypeOptions}>
        <div className={styles.checkboxRow}>
          <Checkbox
            checked={searchParams
              .getAll('project-type')
              .includes('field_recon')}
            onChange={() => toggleProjectTypeFilter('field_recon')}
          />
          &nbsp;
          <strong>Field Research</strong>
        </div>
        <div>
          <label className={styles.sidebarLabel} htmlFor="fr-type-select">
            Field Research Type
          </label>
          <Select
            id="fr-type-select"
            allowClear
            options={[
              { label: 'All Types', value: null },
              ...dropdownOptions.frTypeOptions,
            ]}
            value={searchParams.get('fr-type')}
            onChange={(v) => setSearchParam('fr-type', v)}
            style={{ width: '100%', marginBottom: '5px' }}
            placeholder="All Types"
          />
        </div>
        <div>
          <label className={styles.sidebarLabel} htmlFor="nh-year-select">
            Natural Hazard Year
          </label>
          <Select
            id="nh-year-select"
            options={[{ label: 'All Years', value: null }, ...yearOptions]}
            value={searchParams.get('nh-year')}
            onChange={(v) => setSearchParam('nh-year', v)}
            allowClear
            style={{ width: '100%' }}
            placeholder="All Years"
          />
        </div>
      </article>
      <article className={styles.projectTypeOptions}>
        <div className={styles.checkboxRow}>
          <Checkbox
            checked={searchParams
              .getAll('project-type')
              .includes('hybrid_simulation')}
            onChange={() => toggleProjectTypeFilter('hybrid_simulation')}
          />
          &nbsp;
          <strong>Hybrid Simulation</strong>
        </div>
        <div>
          <label className={styles.sidebarLabel} htmlFor="hybsim-type-select">
            Hybrid Simulation Type
          </label>
          <Select
            id="hybsim-type-select"
            options={[
              { label: 'All Types', value: null },
              ...dropdownOptions.HybridSimTypeOptions,
            ]}
            value={searchParams.get('hyb-sim-type')}
            onChange={(v) => setSearchParam('hyb-sim-type', v)}
            allowClear
            style={{ width: '100%' }}
            placeholder="All Types"
          />
        </div>
      </article>
      <article className={styles.projectTypeOptions}>
        {' '}
        <div className={styles.checkboxRow}>
          <Checkbox
            checked={searchParams.getAll('project-type').includes('other')}
            onChange={() => toggleProjectTypeFilter('other')}
          />
          &nbsp;
          <strong>Other</strong>
        </div>
        <div>
          <label className={styles.sidebarLabel} htmlFor="data-type-select">
            Data Type
          </label>
          <Select
            options={[
              { label: 'All Types', value: null },
              ...dropdownOptions.dataTypeOptions,
              { label: 'Other', value: 'other' },
            ]}
            value={searchParams.get('data-type')}
            onChange={(v) => setSearchParam('data-type', v)}
            allowClear
            style={{ width: '100%' }}
            placeholder="All Types"
          />
        </div>
      </article>
    </section>
  );
};
