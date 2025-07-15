import React, { useEffect, useState, useRef } from 'react';
import styles from './AuditTrails.module.css';
import { Modal } from 'antd';

//holding entire json response
type PortalAuditApiResponse = {
  data: PortalAuditEntry[];
};

//for each row or object in AuditApiResponse
type PortalAuditEntry = {
  session_id: string;
  timestamp: string;
  portal: string;
  username: string;
  action: string;
  tracking_id: string;
  data: any;
};

/* Not being used */
type TapisFilesAuditApiResponse = {
  data: TapisFilesAuditEntry[];
};

/* Will change depending on requirements for tapis file audit UI / not being used */
type TapisFilesAuditEntry = {
  writer_logtime: string;
  action: string;
  jwt_tenant: string;
  jwt_user: string;
  target_system_id: string;
  target_path: string;
  source_path: string;
  tracking_id: string;
  parent_tracking_id: string;
  data: string;
};

const AuditTrail: React.FC = () => {
  const [username, setUsername] = useState('');
  const [source, setSource] = useState('portal');
  const [data, setData] = useState<PortalAuditApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [allUsernames, setAllUsernames] = useState<string[]>([]);
  const [filteredUsernames, setFilteredUsernames] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null); //dropdown closing on exit click
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');
  const [footerEntry, setFooterEntry] = useState<PortalAuditEntry | null>(null);

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

  //getting arr of all usernames one time when page loaded in
  useEffect(() => {
    fetch('/audit/api/usernames/portal')
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
      if (
        allUsernames.some(
          (name) => name.toLowerCase() === username.toLowerCase()
        )
      ) {
        setShowDropdown(false);
      }
    } else {
      setFilteredUsernames([]);
      setShowDropdown(false);
    }
  }, [username]);
  //console.log('Filtered Usernames:', filteredUsernames);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const endpoint = source === 'portal' ? 'portal' : 'tapis';
      const res = await fetch(`/audit/api/user/${username}/${endpoint}/`);
      console.log('username:', username);
      console.log('source:', endpoint);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API error: ${res.status} ${errText}`);
      }
      const result = await res.json();
      console.log('APO RESPOSNE:', result);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    }
    setLoading(false);
    console.log(data);
  };

  function truncate(str: string, n: number) {
    return str.length > n ? str.slice(0, n) + '…' : str;
  }

  const extractActionData = (entry: PortalAuditEntry): string => {
    if (!entry.data) return '-';

    try {
      const action = entry.action?.toLowerCase();
      const parsedData =
        typeof entry.data == 'string' ? JSON.parse(entry.data) : entry.data; //if data is string, we turn it to js object to use it directly
      switch (action) {
        case 'submitjob':
          return extractDataField(parsedData, 'body.job.name') || '-';

        case 'getapp':
          return extractDataField(parsedData, 'query.appId') || '-';

        case 'trash':
          return extractDataField(parsedData, 'path') || '-';

        case 'upload':
          return extractDataField(parsedData, 'path') || '-';

        case 'download':
          return extractDataField(parsedData, 'filePath') || '-';
      }
    } catch {
      return '-';
    }
    return '-';
  };

  const extractDataField = (data: any, path: string): string => {
    if (!data) return '-';
    const fields = path.split('.');
    let value = data;
    for (let i = 0; i < fields.length; i++) {
      if (value && typeof value === 'object' && fields[i] in value) {
        value = value[fields[i]];
      } else {
        return '-';
      }
    }
    if (value === undefined || value == null || value === '') {
      return '-';
    }
    return String(value);
  };

  return (
    <div>
      <Modal
        title="Details"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={
          footerEntry && (
            <div
              style={{
                marginTop: '-30px',
                marginBottom: '10px',
                textAlign: 'center',
              }}
            >
              {footerEntry.username} | {footerEntry.timestamp} |{' '}
              {footerEntry.portal} | {footerEntry.action}
            </div>
          )
        }
        width={550}
        style={{
          maxHeight: '70vh',
          overflow: 'auto',
          top: '200px',
        }}
      >
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {modalContent}
        </pre>
      </Modal>
      {/*<h2>Audit Trail Test</h2>*/}
      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{ marginRight: 8 }}
          >
            <option value="portal">Most Recent User Session Data</option>
            <option value="tapis">File Search Data</option>
          </select>
          <div
            ref={containerRef}
            style={{ position: 'relative', display: 'inline-block' }}
          >
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setShowDropdown(source === 'portal');
              }}
              onFocus={() => {
                setShowDropdown(source === 'portal');
              }}
              placeholder="Username/File Name:"
              style={{ marginRight: 8, width: '100%' }}
            />
            {showDropdown &&
              source === 'portal' &&
              filteredUsernames.length > 0 && (
                <ul className={styles.dropdownList}>
                  {filteredUsernames.map((name) => (
                    <li
                      key={name}
                      onClick={() => {
                        setUsername(name);
                        setShowDropdown(false);
                      }}
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
          <button
            type="submit"
            disabled={loading || !username}
            style={{ marginLeft: '8px' }}
          >
            {loading ? 'Loading…' : 'Submit'}
          </button>
        </div>
      </form>

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {data?.data && data.data.length === 0 && (
        <div>No audit records found.</div>
      )}

      {data?.data && data.data.length > 0 && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
          }}
        >
          <thead>
            <tr>
              <th className={styles.headerCell} style={{ width: '50px' }}>
                User
              </th>
              <th className={styles.headerCell} style={{ width: '50px' }}>
                Date
              </th>
              <th className={styles.headerCell} style={{ width: '50px' }}>
                Time
              </th>
              <th className={styles.headerCell} style={{ width: '100px' }}>
                Portal
              </th>
              <th className={styles.headerCell} style={{ width: '200px' }}>
                Action
              </th>
              <th className={styles.headerCell} style={{ width: '200px' }}>
                Tracking ID
              </th>
              <th className={styles.headerCell} style={{ width: '100px' }}>
                Details
              </th>
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
              const actionDetails = extractActionData(entry);

              return (
                <tr key={idx}>
                  <td className={styles.cell}>{entry.username || '-'}</td>
                  <td className={styles.cell}>{dateStr}</td>
                  <td className={styles.cell}>{timeStr}</td>
                  <td className={styles.cell}>{entry.portal || '-'}</td>
                  <td className={styles.cell}>
                    {entry.action || '-'}
                    {actionDetails !== '-' &&
                      `: ${truncate(actionDetails, 50)}`}
                  </td>
                  <td className={styles.cell}>{entry.tracking_id || '-'}</td>
                  <td
                    className={styles.cell}
                    style={{
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
                      setFooterEntry(entry);
                      setModalOpen(true);
                    }}
                  >
                    View Logs
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

/*
const myComponent = () => {
  useEffect(() => {

  }
  )
}

useEffect(() => {
  const num;
})






*/
