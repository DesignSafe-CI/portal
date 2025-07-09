import React, { useEffect, useState, useRef } from 'react';
import styles from './AuditTrails.module.css';
import { Modal } from 'antd';

//hodling entire json response
interface AuditApiResponse {
  data: AuditEntry[];
}

//for each row or object in AuditApiResponse
interface AuditEntry {
  session_id: string;
  timestamp: string;
  portal: string;
  username: string;
  action: string;
  tracking_id: string;
  data: any;
}

const AuditTrail: React.FC = () => {
  const [username, setUsername] = useState('');
  const [source, setSource] = useState('portal');
  const [data, setData] = useState<AuditApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [allUsernames, setAllUsernames] = useState<string[]>([]);
  const [filteredUsernames, setFilteredUsernames] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');
  const [clickedEntry, setClickedEntry] = useState<AuditEntry | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  //getting arr of all usernames one time when first mounted
  useEffect(() => {
    fetch('/audit/api/usernames/portals')
      .then((res) => res.json())
      .then((data) => setAllUsernames(data.usernames || []));
  }, []);
  //console.log('All usernames', allUsernames);

  //updating filtered arr everytime user changes their input
  useEffect(() => {
    if (username.length > 0) {
      setFilteredUsernames(
        allUsernames
          .filter((name) => name.toLowerCase().includes(username.toLowerCase()))
          .slice(0, 20)
      );
    } else {
      setFilteredUsernames([]);
    }
  }, [username]);
  //console.log('Filtered Usernames:', filteredUsernames);

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
      console.log("APO RESPOSNE:", result)
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    }
    setLoading(false);
    console.log(data)
  };

  function truncate(str: string, n: number) {
    return str.length > n ? str.slice(0, n) + '…' : str;
  }

  return (
    <div>
      <Modal
        title="Details"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={
          clickedEntry && (
            <div
              style={{
                marginTop: '-30px',
                marginBottom: '10px',
                textAlign: 'center'
              }}
            >
              {clickedEntry.username} | {clickedEntry.timestamp} |{' '}
              {clickedEntry.portal} | {clickedEntry.action}
            </div>
          )
        }
        width={550}
        style={{
          maxHeight: '70vh',
          overflow: 'auto',
        }}
      >
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {modalContent}
        </pre>
      </Modal>
      {/*<h2>Audit Trail Test</h2>*/}
      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <div
          ref={containerRef}
          style={{ position: 'relative', display: 'inline-block' }}
        >
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Enter username"
            style={{ marginRight: 8 }}
          />
          {showDropdown && filteredUsernames.length > 0 && (
            <ul className={styles.dropdownList}>
              {filteredUsernames.map((name) => (
                <li
                  key={name}
                  onClick={() => setUsername(name)}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    borderBottom: '1px solid',
                  }}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          style={{ marginRight: 8 }}
        >
          <option value="portal">Most Recent User Session Data</option>
          <option value="tapis">File Search Data</option>
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
                'Details',
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    border: '1px solid var(--global-color-primary--dark)',
                    padding: '10px',
                    textAlign: 'center',
                    background: 'var(--global-color-primary--normal)',
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
                <tr key={idx}> {/* Could probably make a loop for this, also name css class */}
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
                      maxWidth: 200,
                      wordBreak: 'break-all',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                    onClick={() => {
                      let content = '';
                      if (entry.data) {
                        try {
                          const obj =
                            typeof entry.data === 'string'
                              ? JSON.parse(entry.data)
                              : entry.data;
                          content = JSON.stringify(obj, null, 2);
                        } catch {
                          content = entry.data;
                        }
                      }
                      setModalContent(content);
                      setClickedEntry(entry);
                      setModalOpen(true);
                    }}
                  >
                    {truncate(entry.data ? JSON.stringify(entry.data) : '', 50)}
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
//git commit -m "Added pop-up modal functionality for data column (now named Details), Changed names on dropdown menu for type of search, implemented username auto-search dropdown menu capability for easier selection, added css file for AuditTrials.tsx"
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

/* change up query to use jake recommendation 
/* add clickable data section for popup, have it as pretty print */
