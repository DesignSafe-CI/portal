import React from 'react';
import styles from './FileListingTable.module.css';

export const FileListingTableCheckbox: React.FC<{
  checked?: boolean;
  onChange: React.ChangeEventHandler;
}> = ({ checked, onChange }) => {
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
