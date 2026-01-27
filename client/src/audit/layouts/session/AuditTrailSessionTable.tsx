import React, { useState } from 'react';
import { Modal } from 'antd';
import styles from '../../AuditTrail.module.css';
import { PortalAuditEntry } from '@client/hooks';
import { Spinner } from '@client/common-components';
import {
  safePretty,
  truncate,
  extractActionData,
  formatDate,
  formatTime,
} from '../../utils';

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
        <div className={styles.tableWrapper}>
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
                  const dateStr = portalEntry.timestamp
                    ? formatDate(portalEntry.timestamp)
                    : '-';
                  const timeStr = portalEntry.timestamp
                    ? formatTime(portalEntry.timestamp)
                    : '-';
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
