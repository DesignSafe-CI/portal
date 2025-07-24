import React from 'react';
import { useGetSUAllocations, useAuthenticatedUser } from '@client/hooks';
import styles from './Dashboard.module.css';
const HOST_LABELS: Record<string, string> = {
  'ls6.tacc.utexas.edu': 'Lonestar6 (HPC)',
  'frontera.tacc.utexas.edu': 'Frontera (HPC)',
  'stampede3.tacc.utexas.edu': 'Stampede3 (HPC)',
  'vista.tacc.utexas.edu': 'Vista (AI/GPU)',
  'data.tacc.utexas.edu': 'Corral (Storage)',
};

const SUAllocationsCard = () => {
  const { user } = useAuthenticatedUser();
  const { data, isLoading, error } = useGetSUAllocations();

  if (isLoading) return <div>Loading SU allocations...</div>;
  if (error) return <div>Error loading SU allocations</div>;
  if (!data || data.length === 0) return <div>No allocation data found.</div>;

  const validData = data.filter((alloc) => Number(alloc.awarded) > 0);

  const grouped = validData.reduce<Record<string, Record<string, typeof data>>>(
    (acc, alloc) => {
      const description = HOST_LABELS[alloc.host] || '—';
      if (!acc[description]) acc[description] = {};
      if (!acc[description][alloc.host]) acc[description][alloc.host] = [];
      acc[description][alloc.host].push(alloc);
      return acc;
    },
    {}
  );

  return (
    <div className={styles.suCard}>
      <h3 className={styles.suTitle}>
        Allocations of{' '}
        <span className={styles.suUsername}>{user?.username || 'User'}</span>
      </h3>
      {Object.entries(grouped).map(([description, hosts]) => (
        <div key={description} className={styles.suSection}>
          <h4>{description}</h4>
          {Object.entries(hosts).map(([host, allocations]) => (
            <div key={host}>
              <div className={styles.suHost}>Host: {host}</div>
              <table className={styles.suTable}>
                <thead>
                  <tr className={styles.suTheadRow}>
                    <th className={styles.suTh}>Project Code</th>
                    <th className={styles.suTh}>Awarded</th>
                    <th className={styles.suTh}>Remaining</th>
                    <th className={styles.suTh}>Expiration</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc, i) => (
                    <tr key={i}>
                      <td className={styles.suTd}>{alloc.project_code}</td>
                      <td className={styles.suTd}>{alloc.awarded}</td>
                      <td className={styles.suTd}>{alloc.remaining}</td>
                      <td className={styles.suTd}>{alloc.expiration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default SUAllocationsCard;
