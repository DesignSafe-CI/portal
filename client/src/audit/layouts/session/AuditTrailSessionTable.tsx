import React, { useState } from 'react';
import { Modal } from 'antd';
import styles from '../../AuditTrail.module.css';
import { PortalAuditEntry } from '@client/hooks';
import { Spinner } from '@client/common-components';

interface AuditTrailSessionTableProps {
  auditData:
    | {
        data: PortalAuditEntry[];
      }
    | undefined;
  auditError: Error | null;
  auditLoading: boolean;
}

const AuditTrailSessionTable: React.FC<AuditTrailSessionTableProps> = ({
  auditData,
  auditError,
  auditLoading,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [footerEntry, setFooterEntry] = useState<PortalAuditEntry | null>(null);

  const safePretty = (value: unknown) => {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return '';
    }
  };

  const handleViewLogs = (entry: PortalAuditEntry) => {
    const content = safePretty(entry.data as unknown);
    setModalContent(content);
    setFooterEntry(entry);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalContent('');
    setFooterEntry(null);
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
          return extractDataField(parsedData, 'body.file_name') || '-';

        case 'download':
          return extractDataField(parsedData, 'filePath') || '-';
      }
    } catch {
      return '-';
    }
    return '-';
  };

  const extractDataField = (data: unknown, path: string): string => {
    if (!data) return '-';
    const fields = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = data as any;
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
    <>
      <h3>Latest Session History</h3>
      <Modal
        title="Details"
        open={modalOpen}
        onCancel={handleModalClose}
        footer={
          footerEntry && (
            <div
              style={{
                marginTop: '-5px',
                marginBottom: '0px',
                textAlign: 'center',
              }}
            >
              {footerEntry.username} | {footerEntry.timestamp} |{' '}
              {footerEntry.portal} | {footerEntry.action}
            </div>
          )
        }
        centered
        width={550}
      >
        <pre className={styles.modalContent}>{modalContent}</pre>
      </Modal>

      {auditError && (
        <div style={{ color: 'red' }}>Error: {auditError.message}</div>
      )}

      {auditLoading && <Spinner />}

      {auditData?.data && auditData.data.length === 0 && (
        <div>No records found.</div>
      )}

      {auditData?.data && auditData.data.length > 0 && (
        <div className="styles.tableWrapper">
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              tableLayout: 'auto',
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
              {(auditData.data as PortalAuditEntry[]).map(
                (portalEntry, idx) => {
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
                      <td className={styles.cell}>
                        {portalEntry.portal || '-'}
                      </td>
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
                        style={{ wordBreak: 'break-all' }}
                        onClick={() => handleViewLogs(portalEntry)}
                      >
                        <span className={styles.viewLogsLink}>View Logs</span>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default AuditTrailSessionTable;
