import React from 'react';
import styles from './ReconPortalHeader.module.css';
import '../styles/tailwind.css';

export const ReconPortalHeader: React.FC = () => {

  return (
    // <div className={styles.root}>
    //   Header Placeholder
    // </div>
    <div className="p-4 bg-gray-100 text-center">
      <h1 className="text-2xl font-bold bg-cyan-200">Welcome to Recon Portal</h1>
    </div>
  );
};
