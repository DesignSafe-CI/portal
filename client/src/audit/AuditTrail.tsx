import React, { useState } from 'react';
import styles from './AuditTrails.module.css';
import { Modal, AutoComplete } from 'antd';
import {
  useGetRecentSession,
  useGetFileHistory,
  useGetUsernames,
  PortalAuditEntry,
} from '@client/hooks';

const AuditTrail: React.FC = () => {
  const [username, setUsername] = useState('');
  const [source, setSource] = useState<'portal' | 'tapis'>('portal');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string>('');
  const [footerEntry, setFooterEntry] = useState<PortalAuditEntry | null>(null);

  const { data: allUsernames } = useGetUsernames();
  const {
    data: portalData,
    error: portalError,
    isLoading: portalLoading,
    refetch: refetchPortal,
  } = useGetRecentSession(username, false);

  const {
    data: fileData,
    error: fileError,
    isLoading: fileLoading,
    refetch: refetchFile,
  } = useGetFileHistory(username, false);

  const filteredUsernames =
    username.length > 0 && allUsernames
      ? allUsernames
          .filter((name) => name.toLowerCase().includes(username.toLowerCase()))
          .slice(0, 20)
      : [];

  const auditData = source === 'portal' ? portalData : fileData;
  const auditError = source === 'portal' ? portalError : fileError;
  const auditLoading = source === 'portal' ? portalLoading : fileLoading;
  const auditRefetch = source === 'portal' ? refetchPortal : refetchFile;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    auditRefetch();
  };

  function truncate(str: string, n: number) {
    return str.length > n ? str.slice(0, n) + '…' : str;
  }

  const extractActionData = (entry: PortalAuditEntry): string => {
    if (!entry.data) return '-';

    try {
      const action = entry.action?.toLowerCase();
      const parsedData =
        typeof entry.data == 'string' ? JSON.parse(entry.data) : entry.data;
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
    // eslint-disable-line @typescript-eslint/no-explicit-any
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
      <form onSubmit={onSearch} style={{ marginBottom: 16 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as 'portal' | 'tapis')}
            style={{ marginRight: 8 }}
          >
            <option value="portal">Most Recent User Session Data</option>
            <option value="tapis">File Search Data</option>
          </select>
          <AutoComplete
            value={username}
            style={{ marginRight: 8, width: '200px' }}
            options={
              source === 'portal'
                ? filteredUsernames.map((name) => ({
                    value: name,
                    label: name,
                  }))
                : []
            }
            onSelect={(value) => {
              setUsername(value);
            }}
            onSearch={(searchText) => {
              setUsername(searchText);
            }}
            placeholder="Username/File Name:"
          />
          <button
            type="submit"
            disabled={auditLoading || !username}
            style={{ marginLeft: '8px' }}
          >
            {auditLoading ? 'Loading…' : 'Submit'}
          </button>
        </div>
      </form>

      {auditError && (
        <div style={{ color: 'red' }}>Error: {auditError.message}</div>
      )}

      {auditData?.data && auditData.data.length === 0 && (
        <div>No records found.</div>
      )}

      {auditData?.data && auditData.data.length > 0 && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
          }}
        >
          <thead>
            <tr>
              {[
                { label: 'User', width: '50px' },
                { label: 'Date', width: '50px' },
                { label: 'Time', width: '50px' },
                { label: 'Portal', width: '100px' },
                { label: 'Action', width: '200px' },
                { label: 'Tracking ID', width: '200px' },
                { label: 'Details', width: '100px' },
              ].map((col) => (
                <th
                  key={col.label}
                  className={styles.headerCell}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(auditData.data as PortalAuditEntry[]).map((entry, idx) => {
              //need to change once type for filesearch decided upon
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
                          content = JSON.stringify(entry.data, null, 2);
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
export default AuditTrail;
