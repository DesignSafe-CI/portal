import React from 'react';
import { Modal } from 'antd';
import styles from './AuditTrails.module.css';
import { PortalAuditEntry, TapisFilesAuditEntry } from '@client/hooks';
import { Spinner } from '@client/common-components';

interface AuditTrailTableProps {
  auditData: { data: (PortalAuditEntry | TapisFilesAuditEntry)[] } | undefined;
  auditError: Error | null;
  auditLoading: boolean;
  modalOpen: boolean;
  modalContent: string;
  footerEntry: PortalAuditEntry | null;
  onModalClose: () => void;
  onViewLogs: (entry: PortalAuditEntry) => void;
  source: 'portal' | 'tapis';
}

const AuditTrailTable: React.FC<AuditTrailTableProps> = ({
  auditData,
  auditError,
  auditLoading,
  modalOpen,
  modalContent,
  footerEntry,
  onModalClose,
  onViewLogs,
  source,
}) => {
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

  //helper function to get columns based on source
  const getColumns = () => {
    if (source === 'portal') {
      return [
        { label: 'User', width: '50px' },
        { label: 'Date', width: '50px' },
        { label: 'Time', width: '50px' },
        { label: 'Portal', width: '100px' },
        { label: 'Action', width: '200px' },
        { label: 'Tracking ID', width: '200px' },
        { label: 'Details', width: '100px' },
      ];
    } else {
      return [
        { label: 'Filename', width: '100px' },
        { label: 'User', width: '80px' },
        { label: 'Date', width: '80px' },
        { label: 'Time', width: '80px' },
        { label: 'Action', width: '100px' },
        { label: 'Location', width: '150px' },
      ];
    }
  };

  return (
    <>
      {/* Only show modal for portal data */}
      {source === 'portal' && (
        <Modal
          title="Details"
          open={modalOpen}
          onCancel={onModalClose}
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
      )}

      {auditError && (
        <div style={{ color: 'red' }}>Error: {auditError.message}</div>
      )}

      {auditLoading && <Spinner />}

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
              {getColumns().map((col) => (
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
            {(
              auditData.data as (PortalAuditEntry | TapisFilesAuditEntry)[]
            ).map((entry, idx) => {
              if (source === 'portal') {
                //portal data
                const portalEntry = entry as PortalAuditEntry;
                let dateStr = '-';
                let timeStr = '-';
                if (portalEntry.timestamp) {
                  const date = new Date(portalEntry.timestamp);
                  dateStr = date.toLocaleDateString();
                  timeStr = date.toLocaleTimeString();
                }
                const actionDetails = extractActionData(portalEntry);

                return (
                  <tr key={idx}>
                    <td className={styles.cell}>
                      {portalEntry.username || '-'}
                    </td>
                    <td className={styles.cell}>{dateStr}</td>
                    <td className={styles.cell}>{timeStr}</td>
                    <td className={styles.cell}>{portalEntry.portal || '-'}</td>
                    <td className={styles.cell}>
                      {portalEntry.action || '-'}
                      {actionDetails !== '-' &&
                        `: ${truncate(actionDetails, 50)}`}
                    </td>
                    <td className={styles.cell}>
                      {portalEntry.tracking_id || '-'}
                    </td>
                    <td
                      className={styles.cell}
                      style={{
                        wordBreak: 'break-all',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                      onClick={() => onViewLogs(portalEntry)}
                    >
                      View Logs
                    </td>
                  </tr>
                );
              } else {
                //file data
                const tapisEntry = entry as TapisFilesAuditEntry;
                let dateStr = '-';
                let timeStr = '-';
                if (tapisEntry.writer_logtime) {
                  const date = new Date(tapisEntry.writer_logtime);
                  dateStr = date.toLocaleDateString();
                  timeStr = date.toLocaleTimeString();
                }

                return (
                  <tr key={idx}>
                    <td className={styles.cell}>
                      {tapisEntry.target_path || '-'}
                    </td>
                    <td className={styles.cell}>
                      {tapisEntry.jwt_user || '-'}
                    </td>
                    <td className={styles.cell}>{dateStr}</td>
                    <td className={styles.cell}>{timeStr}</td>
                    <td className={styles.cell}>{tapisEntry.action || '-'}</td>
                    <td className={styles.cell}>
                      {tapisEntry.target_path || '-'}
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      )}
    </>
  );
};

export default AuditTrailTable;
