import React from 'react';
import { useGetSUAllocations } from '../../../_hooks/src/workspace/useSUAllocations';
import { useAuthenticatedUser } from '@client/hooks';

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

  const grouped = validData.reduce<Record<string, Record<string, typeof data>>>((acc, alloc) => {
    const description = HOST_LABELS[alloc.host] || '—';
    if (!acc[description]) acc[description] = {};
    if (!acc[description][alloc.host]) acc[description][alloc.host] = [];
    acc[description][alloc.host].push(alloc);
    return acc;
  }, {});

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 16 }}>
      <h3 style={{ marginBottom: 12 }}>
        Allocations of <span style={{ color: '#2b6cb0' }}>{user?.username || 'User'}</span>
      </h3>
      {Object.entries(grouped).map(([description, hosts]) => (
        <div key={description} style={{ marginBottom: 12 }}>
          <h4 style={{ marginBottom: 2 }}>{description}</h4>
          {Object.entries(hosts).map(([host, allocations]) => (
            <div key={host} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Host: {host}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={thStyle}>Project Code</th>
                    <th style={thStyle}>Awarded</th>
                    <th style={thStyle}>Remaining</th>
                    <th style={thStyle}>Expiration</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc, i) => (
                    <tr key={i}>
                      <td style={tdStyle}>{alloc.project_code}</td>
                      <td style={tdStyle}>{alloc.awarded}</td>
                      <td style={tdStyle}>{alloc.remaining}</td>
                      <td style={tdStyle}>{alloc.expiration}</td>
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

const thStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid #ddd',
  textAlign: 'left'
};

const tdStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid #eee'
};

export default SUAllocationsCard;
