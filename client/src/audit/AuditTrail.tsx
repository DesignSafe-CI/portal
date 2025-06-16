import React, { useState } from 'react';

const AuditTrail: React.FC = () => {
  const [username, setUsername] = useState('');
  const [source, setSource] = useState('portal');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const res = await fetch(`/audit/api/user/${username}/last-session/?source=${source}`);
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <h2>Audit Trail Test</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Enter username"
        />
        <select value={source} onChange={e => setSource(e.target.value)}>
          <option value="portal">Portal Audit - most recent session</option>
          <option value="tapis">Tapis Files Audit</option>
        </select>
        <button type="submit" disabled={loading || !username}>
          {loading ? 'Loading...' : 'Submit'}
        </button>
      </form>
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      <pre>
        {data?.data?.map((entry: any) => {
          let prettyData = entry.data;
          try { prettyData = JSON.stringify(JSON.parse(entry.data), null, 5); } catch {}
          const { data, ...rest } = entry;
          return (
            JSON.stringify(rest, null, 2) +
            `\n  "data": ${prettyData}\n\n`
          );
        }).join('')}
      </pre>
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
