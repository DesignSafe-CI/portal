import React from 'react';
import styles from './JobsListingTable.module.css';

export const JobsListingTableCheckbox: React.FC<{
  checked?: boolean;
  onChange: React.ChangeEventHandler;
}> = ({ checked, onChange }) => {
  /*
  This checkbox component is more barebones than the checkbox exported by Ant,
  and is suited to large file listings where it will be rerendered extensively.
  */
  return (
    <label className={styles['checkbox-wrapper']}>
      <span
        className={`${styles['checkbox']} ${
          checked ? styles['checkbox-checked'] : ''
        }`}
      >
        <input
          className={styles['checkbox-input']}
          type="checkbox"
          checked={checked}
          onChange={onChange}
        />
        <span className={styles['checkbox-inner']}></span>
      </span>
    </label>
  );
};
