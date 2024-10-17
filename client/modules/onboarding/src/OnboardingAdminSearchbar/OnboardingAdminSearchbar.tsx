import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '_common';
import { useDispatch, useSelector } from 'react-redux';

import styles from './OnboardingAdminSearchbar.module.scss';

const OnboardingAdminSearchbar = ({ className, disabled }) => {
  const { query } = useSelector((state) => state.onboarding.admin);
  const [search, setSearch] = useState(query);
  const dispatch = useDispatch();

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch({
      type: 'FETCH_ONBOARDING_ADMIN_LIST',
      payload: {
        limit: 25,
        offset: 0,
        query: search,
      },
    });
  };
  const onClear = (e) => {
    e.preventDefault();
    setSearch('');
    dispatch({
      type: 'FETCH_ONBOARDING_ADMIN_LIST',
      payload: {
        limit: 25,
        offset: 0,
        query: null,
      },
    });
  };
  const onChange = (e) => {
    setSearch(e.target.value);
    if (!e.target.value) {
      onClear(e);
    }
  };

  return (
    <form
      aria-label="Search"
      className={`${className} ${styles.container}`}
      onSubmit={onSubmit}
    >
      <div className={`input-group ${styles['query-fieldset']}`}>
        <div className="input-group-prepend">
          <Button
            attr="submit"
            type="secondary"
            size="medium"
            disabled={disabled}
            iconNameBefore="search"
          >
            Search
          </Button>
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
          disabled={disabled}
        />
      </div>
    </form>
  );
};

OnboardingAdminSearchbar.propTypes = {
  /** Additional `className` for the root element */
  className: PropTypes.string,
  disabled: PropTypes.bool,
};
OnboardingAdminSearchbar.defaultProps = {
  className: '',
  disabled: false,
};

export default OnboardingAdminSearchbar;
