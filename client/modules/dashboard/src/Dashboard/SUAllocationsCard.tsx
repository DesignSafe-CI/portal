import React from 'react';
import { useGetAllocations } from '@client/hooks';

const HOST_LABELS: Record<string, string> = {
  'ls6.tacc.utexas.edu': 'Lonestar6 (HPC)',
  'frontera.tacc.utexas.edu': 'Frontera (HPC)',
  'stampede3.tacc.utexas.edu': 'Stampede3 (HPC)',
  'vista.tacc.utexas.edu': 'Vista (AI/GPU)',
  'data.tacc.utexas.edu': 'Corral (Storage)',
};

const SUAllocationsCard = () => {
  const { data, isLoading, error } = useGetAllocations();

  if (isLoading) return <div>Loading SU allocations...</div>;
  if (error) return <div>Error loading SU allocations</div>;
  if (!data) return <div>No allocation data found.</div>;

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <h3 style={{ marginBottom: 12 }}>My Allocations by Host</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Host</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Allocations</th>
            <th style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>Description</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(data.hosts).map(([host, projects]) => (
            <tr key={host}>
              <td style={{ padding: '8px', verticalAlign: 'top' }}>
                <strong>{host}</strong>
              </td>
              <td style={{ padding: '8px', verticalAlign: 'top' }}>
                {projects.join(', ')}
              </td>
              <td style={{ padding: '8px', verticalAlign: 'top' }}>
                {HOST_LABELS[host] || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SUAllocationsCard;
