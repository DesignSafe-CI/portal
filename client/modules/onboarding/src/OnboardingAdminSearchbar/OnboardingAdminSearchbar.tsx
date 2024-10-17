import React, { FormEvent, FormEventHandler, useState } from 'react';
import { SecondaryButton } from '@client/common-components';
import { useGetOnboardingAdminList } from '@client/hooks';
import styles from './OnboardingAdminSearchbar.module.css';

export const OnboardingAdminSearchbar = () => {
  const [search, setSearch] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    useGetOnboardingAdminList({
      limit: 25,
      offset: 0,
      query_string: search,
    });
  };
  const onClear = (e: FormEvent) => {
    e.preventDefault();
    setSearch('');
    useGetOnboardingAdminList({
      limit: 25,
      offset: 0,
    });
  };
  const onChange = (e: FormEvent) => {
    setSearch(e.target.value);
    if (!e.target.value) {
      onClear(e);
    }
  };

  return (
    <form
      aria-label="Search"
      className={`${styles.container}`}
      onSubmit={onSubmit}
    >
      <div className={`input-group ${styles['query-fieldset']}`}>
        <div className="input-group-prepend">
          <SecondaryButton
            // disabled={disabled}
            icon="search"
          >
            Search
          </SecondaryButton>
        </div>
        <input
          type="search"
          onChange={onChange}
          value={search || ''}
          name="query"
          aria-label="Search for users"
          className={`form-control ${styles.input}`}
          placeholder="Search for users"
          data-testid="input"
          autoComplete="off"
          // disabled={disabled}
        />
      </div>
    </form>
  );
};
