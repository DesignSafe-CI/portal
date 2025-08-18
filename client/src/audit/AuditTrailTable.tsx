import React from 'react';
import { Modal } from 'antd';
import styles from './AuditTrails.module.css';
import {
  PortalAuditEntry,
  PortalFileAuditEntry,
  TapisFileAuditEntry,
} from '@client/hooks';
import { Spinner } from '@client/common-components';

interface AuditTrailTableProps {
  auditData:
    | {
        data: (PortalAuditEntry | PortalFileAuditEntry | TapisFileAuditEntry)[];
      }
    | undefined;
  auditError: Error | null;
  auditLoading: boolean;
  modalOpen: boolean;
  modalContent: string;
  footerEntry: PortalAuditEntry | null;
  onModalClose: () => void;
  onViewLogs: (entry: PortalAuditEntry | PortalFileAuditEntry) => void;
  mode: 'user-session' | 'portal-file' | 'tapis-file';
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
  mode,
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
          return extractDataField(parsedData, 'body.file_name') || '-';

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

  function safeParseData(data: unknown): Record<string, unknown> | null {
    try {
      if (!data) return null;
      if (typeof data === 'string') return JSON.parse(data);
      if (typeof data === 'object') return data as Record<string, unknown>;
    } catch {
      // ignore
    }
    return null;
  }

  function getPortalFilename(entry: PortalFileAuditEntry): string {
    const parsed = safeParseData((entry as any).data);
    if (!parsed) return '-';

    const action = (entry.action || '').toLowerCase();

    if (action === 'upload') {
      return extractDataField(parsed, 'body.file_name') || '-';
    }

    if (action === 'rename') {
      return extractDataField(parsed, 'body.new_name') || '-';
    }

    if (action === 'move') {
      const pathVal = extractDataField(parsed, 'path');
      return pathVal !== '-' ? pathVal.split('/').pop() || '-' : '-';
    }

    if (action === 'submitjob') {
      const body = parsed?.body as any;
      if (body?.job?.fileInputs?.[0]?.sourceUrl) {
        const sourceUrl = body.job.fileInputs[0].sourceUrl;
        const filename = sourceUrl.split('/').pop() || '';
        return filename;
      }
      return '-';
    }

    // fallback: try path last segment
    const fallbackPath = extractDataField(parsed, 'path');
    return fallbackPath !== '-' ? fallbackPath.split('/').pop() || '-' : '-';
  }

  function getPortalFileLocation(
    entry: PortalFileAuditEntry,
    extractDataField: (obj: any, path: string) => string
  ): string {
    const parsed = safeParseData((entry as any).data);
    const action = (entry.action || '').toLowerCase();

    let source = '-';
    let dest = '-';

    if (!parsed) return 'nan ---> -';

    switch (action) {
      case 'upload':
      case 'rename':
        source = 'nan';
        dest = extractDataField(parsed, 'path');
        break;

      case 'move':
        source = extractDataField(parsed, 'path');
        dest = extractDataField(parsed, 'body.dest_path');
        break;

      case 'trash':
        source = extractDataField(parsed, 'body.path');
        dest = extractDataField(parsed, 'body.trash_path');
        break;

      case 'submitjob':
        source = 'nan';
        dest = extractDataField(parsed, 'body.job.fileInputs.0.sourceUrl');
        break;

      default:
        source = 'nan';
        dest = extractDataField(parsed, 'path');
    }

    if (!source || source === '-') source = 'nan';
    if (!dest || dest === '-') dest = '-';

    return `${source} → ${dest}`;
  }

  //helper function to get columns based on source
  const getColumns = () => {
    if (mode === 'user-session') {
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
        { label: 'Details', width: '150px' },
      ];
    }
  };

  return (
    <>
      {(mode === 'user-session' || mode === 'portal-file') && (
        <Modal
          title="Details"
          open={modalOpen}
          onCancel={onModalClose}
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
          width={550}
          style={{
            marginTop: '250px',
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
        // change to "Unable to load" later for simplicity
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
                auditData.data as (
                  | PortalAuditEntry
                  | PortalFileAuditEntry
                  | TapisFileAuditEntry
                )[]
              ).map((entry, idx) => {
                if (mode === 'user-session') {
                  //portal session display
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
                }
                //portal file display
                //To-do: fill out with correct info
                else if (mode === 'portal-file') {
                  const portalFileEntry = entry as PortalFileAuditEntry;

                  let dateStr = '-';
                  let timeStr = '-';
                  if (portalFileEntry.timestamp) {
                    const date = new Date(portalFileEntry.timestamp);
                    dateStr = date.toLocaleDateString();
                    timeStr = date.toLocaleTimeString();
                  }

                  const filenameStr = getPortalFilename(portalFileEntry);
                  const locationStr = getPortalFileLocation(
                    portalFileEntry,
                    extractDataField
                  );
                  return (
                    <tr key={idx}>
                      <td className={styles.cell}>
                        {' '}
                        {/*filename*/}
                        {filenameStr}
                      </td>
                      <td className={styles.cell}>
                        {' '}
                        {/*user*/}
                        {portalFileEntry.username || '-'}
                      </td>
                      <td className={styles.cell}>{dateStr}</td> {/*date*/}
                      <td className={styles.cell}>{timeStr}</td> {/*time*/}
                      <td className={styles.cell}>
                        {portalFileEntry.action || '-'} {/*action*/}
                      </td>
                      <td className={styles.cell}>
                        {locationStr} {/*location*/}
                      </td>
                      <td
                        className={styles.cell}
                        style={{
                          wordBreak: 'break-all',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                        onClick={() => onViewLogs(portalFileEntry)}
                      >
                        View Logs
                      </td>
                    </tr>
                  );
                }

                //tapis file display
                //To-do: fill out with the correct info
                else if (mode === 'tapis-file') {
                  const tapisFileEntry = entry as TapisFileAuditEntry;
                  let dateStr = '-';
                  let timeStr = '-';
                  if (tapisFileEntry.writer_logtime) {
                    const date = new Date(tapisFileEntry.writer_logtime);
                    dateStr = date.toLocaleDateString();
                    timeStr = date.toLocaleTimeString();
                  }

                  //needs rework on which things its showcasing after tapisFileEntry.etc, not correct as is right now
                  return (
                    <tr key={idx}>
                      <td className={styles.cell}>
                        {tapisFileEntry.target_path || '-'}
                      </td>
                      <td className={styles.cell}>
                        {tapisFileEntry.obo_user || '-'}
                      </td>
                      <td className={styles.cell}>{dateStr}</td>
                      <td className={styles.cell}>{timeStr}</td>
                      <td className={styles.cell}>
                        {tapisFileEntry.action || '-'}
                      </td>
                      <td className={styles.cell}>
                        {tapisFileEntry.target_path || '-'}
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default AuditTrailTable;
