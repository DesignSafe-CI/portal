import React, { useState } from 'react';

interface AuditEntry {
  session_id: string;
  timestamp: string;
  portal: string;
  username: string;
  action: string;
  tracking_id: string;
  data: any;
}

interface AuditApiResponse {
  data: AuditEntry[];
}

const AuditTrail: React.FC = () => {
  const [username, setUsername] = useState('');
  const [source, setSource] = useState('portal');
  const [data, setData] = useState<AuditApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/audit/api/user/${username}/last-session/?source=${source}`
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error: ${res.status} ${errText}`);
      }
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Audit Trail Test</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          style={{ marginRight: 8 }}
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          style={{ marginRight: 8 }}
        >
          <option value="portal">Portal Audit - most recent session</option>
          <option value="tapis">Tapis Files Audit</option>
        </select>
        <button type="submit" disabled={loading || !username}>
          {loading ? 'Loading…' : 'Submit'}
        </button>
      </form>

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {data?.data && data.data.length === 0 && (
        <div>No audit records found.</div>
      )}

      {data?.data && data.data.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {[
                'Username',
                'Date',
                'Time',
                'Portal',
                'Action',
                'Tracking ID',
                'Data',
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    border: '1px solid #ccc',
                    padding: '8px',
                    textAlign: 'left',
                    background: '#f5f5f5',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.data.map((entry, idx) => {
              let dateStr = '-';
              let timeStr = '-';
              if (entry.timestamp) {
                const date = new Date(entry.timestamp);
                dateStr = date.toLocaleDateString();
                timeStr = date.toLocaleTimeString();
              }

              return (
                <tr key={idx}>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {entry.username || '-'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {dateStr}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {timeStr}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {entry.portal || '-'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {entry.action || '-'}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                    {entry.tracking_id || '-'}
                  </td>
                  <td
                    style={{
                      border: '1px solid #ccc',
                      padding: '8px',
                      verticalAlign: 'top',
                    }}
                  >
                    <div
                      style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        background: '#fafafa',
                        padding: '8px',
                        fontFamily: 'monospace',
                        fontSize: '0.9em',
                      }}
                    >
                      <pre style={{ margin: 0 }}>
                        {entry.data ? JSON.stringify(entry.data, null, 2) : ''}
                      </pre>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AuditTrail;

//joyce_cywu
//jr93
//nathanf
//droueche
//thbrown
//uwrapid
//rjn5308
//haan

/*  OG Query for most recent portal session
    query = f"""
       SELECT session_id, timestamp, portal, username, action, data
       FROM {table}
       WHERE session_id = (
           SELECT session_id
           FROM public.portal_audit
           WHERE username = %s
           ORDER BY timestamp DESC
           LIMIT 1
       )
       ORDER BY timestamp ASC;
      
       """
*/

/*
/* no file tracing, just work on portal audit stuff for right now 
/* expandable option on data column if too long, not too sure what design for that yet 
/* have the timestamp be more readable, maybe split into 2 columns CHECK CHECK CHECK 
/* add tracking_id as another column option show on UI    CHECK CHECK CHECK
*/
