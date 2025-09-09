import React, { useState } from 'react';
import {
  DownOutlined,
  UpOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import AuditTrailFileTimeline from './AuditTrailFileTimeline';
import { PortalFileAuditEntry } from '@client/hooks';
import { Spinner } from '@client/common-components';
import styles from './AuditTrails.module.css';

interface AuditTrailFileTableProps {
  auditData: { data: PortalFileAuditEntry[] } | undefined;
  auditError: any;
  auditLoading: boolean;
  searchTerm?: string;
}

type DataObj = {
  path?: string;
  body?: { file_name?: string; new_name?: string };
};

const AuditTrailFileTable: React.FC<AuditTrailFileTableProps> = ({
  auditData,
  auditError,
  auditLoading,
  searchTerm,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  //changing format to readable one
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    });
  };

  //getting filename to display on each dropdown menu, is "rename" row, uses body.new_name, if "upload" row, uses body.file_name
  // if else, try to get basename from data.path, and if all fails use tracking_id as filename
  const getFilename = (entry: PortalFileAuditEntry) => {
    if (!entry) return 'Unknown file';
    const action = (entry.action || '').toLowerCase();
    const dataObj: DataObj | undefined =
      typeof entry.data === 'string' ? undefined : (entry.data as DataObj);
    const body = dataObj?.body;
    if (action === 'rename' && body && body.new_name) {
      return body.new_name;
    }
    if (body && body.file_name) {
      return body.file_name;
    }
    const path = dataObj?.path;
    if (typeof path === 'string' && path) {
      const base = path.replace(/\/$/, '').split('/').pop();
      if (base) return base;
    }
    //Fallback to tracking_id if nothing else
    return entry.tracking_id || 'Unknown file';
  };

  const getFirstAppearance = (entry: PortalFileAuditEntry) => {
    const dataObj: DataObj | undefined =
      typeof entry.data === 'string' ? undefined : (entry.data as DataObj);
    const rawPath = dataObj?.path;
    if (!rawPath || typeof rawPath !== 'string') {
      return 'Upload at (path unavailable)';
    }

    const segments = rawPath.split('/');
    const lastSegment = segments[segments.length - 1] || '';
    const directoryPath = lastSegment.includes('.')
      ? segments.slice(0, -1).join('/') || '/'
      : rawPath;

    return `Upload at ${directoryPath}`;
  };

  const getUser = (entry: PortalFileAuditEntry) => {
    return (entry && entry.username) || 'Unknown user';
  };

  //picking summary entry, if row is upload and search term matches the filename(data.body.file_name) in that row, then we use that one
  //is no upload row is found, look for rename row and search terms that matches filename (data.body.new_name) in that row, then we use that one instead
  const pickSummaryEntry = (entries: PortalFileAuditEntry[], term?: string) => {
    if (!entries || entries.length === 0) return undefined;
    const lowered = (term || '').toLowerCase();
    if (lowered) {
      //upload search
      const uploadHit = entries.find((e) => {
        if ((e.action || '').toLowerCase() !== 'upload') return false;
        const d: DataObj | undefined =
          typeof e.data === 'string' ? undefined : (e.data as DataObj);
        return (d?.body?.file_name || '').toLowerCase() === lowered;
      });
      if (uploadHit) return uploadHit;

      //rename search
      const renameHit = entries.find((e) => {
        if ((e.action || '').toLowerCase() !== 'rename') return false;
        const d: DataObj | undefined =
          typeof e.data === 'string' ? undefined : (e.data as DataObj);
        return (d?.body?.new_name || '').toLowerCase() === lowered;
      });
      if (renameHit) return renameHit;
    }
    return entries[0];
  };

  if (auditLoading) {
    return <Spinner />;
  }

  if (auditError) {
    return <div>Error loading file table: {auditError.message}</div>;
  }

  const rawData = auditData && auditData.data ? auditData.data : [];

  const displayData = Array.isArray(rawData[0]) ? rawData : [];

  return (
    <div>
      <h3>File History</h3>

      <details style={{ marginBottom: '15px', color: 'gray' }}>
        <summary
          style={{
            cursor: 'pointer',
            fontSize: '14px',
            display: 'inline-flex',
            gap: '5px',
            lineHeight: 1,
          }}
        >
          <InfoCircleOutlined />
          Timeline guide
        </summary>
        <div style={{ marginTop: '5px', fontSize: '12px' }}>
          <ul style={{ paddingLeft: '20px' }}>
            <li>Click a row to open its timeline.</li>
            <li>Each circle shows an action (upload, rename, move, trash).</li>
            <li>Red outline highlights the file name you searched for.</li>
            <li>
              Hover over filename/first appearance text for full value; use
              “View logs” for raw data.
            </li>
          </ul>
        </div>
      </details>

      {auditData &&
        displayData.length === 0 &&
        !auditLoading &&
        !auditError && <div>No file history found.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {displayData.map((fileEntries, fileIndex) => {
          const entriesArr = Array.isArray(fileEntries)
            ? fileEntries
            : [fileEntries];
          const firstEntry =
            pickSummaryEntry(
              entriesArr as PortalFileAuditEntry[],
              searchTerm
            ) || (entriesArr[0] as PortalFileAuditEntry);
          const isExpanded = expandedItems.has(fileIndex);
          const filename = getFilename(firstEntry);
          const firstAppearance = getFirstAppearance(firstEntry);
          const user = getUser(firstEntry);
          const timestamp = formatTimestamp(firstEntry.timestamp);

          return (
            <div key={fileIndex}>
              {/* summary box clickable */}
              <div
                className={styles.summaryBox}
                onClick={() => toggleExpanded(fileIndex)}
              >
                {/* filename on the left for each summary box */}
                <div className={styles.filenameSummaryBox}>
                  <Tooltip title={filename} placement="top">
                    <span className={styles.clip}>{filename}</span>
                  </Tooltip>
                </div>

                {/* middle details column (First Appearance, User, Timestamp) */}
                <div className={styles.details}>
                  <div className={styles.row}>
                    <span className={styles.label}>First Appearance:</span>
                    <Tooltip title={firstAppearance} placement="top">
                      <span className={styles.value}>{firstAppearance}</span>
                    </Tooltip>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.label}>User:</span>
                    <span className={styles.value}>{user}</span>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.label}>Timestamp:</span>
                    <span className={styles.value}>{timestamp}</span>
                  </div>
                </div>

                {/* up/down outline icon*/}
                <div
                  style={{
                    fontSize: '25px',
                    color: 'gray',
                  }}
                >
                  {isExpanded ? <UpOutlined /> : <DownOutlined />}
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: '10px' }}>
                  <AuditTrailFileTimeline
                    operations={
                      Array.isArray(fileEntries) ? fileEntries : [fileEntries]
                    }
                    filename={filename}
                    searchTerm={searchTerm}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuditTrailFileTable;
