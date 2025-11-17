import React, { useState } from 'react';
import {
  DownOutlined,
  UpOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import AuditTrailFileTimeline from './AuditTrailFileTimeline';
import { FileHistoryResponse, Timeline } from '@client/hooks';
import { Spinner } from '@client/common-components';
import { formatTimestamp, getDisplayFileName } from '../../utils';
import styles from '../../AuditTrail.module.css';

interface AuditTrailFileTableProps {
  auditData: FileHistoryResponse | undefined;
  auditError: Error | null;
  auditLoading: boolean;
  searchTerm?: string;
}

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

  if (auditLoading) {
    return <Spinner />;
  }

  if (auditError) {
    return <div>Error loading file table: {auditError.message}</div>;
  }

  const timelines = auditData?.timelines || [];

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
              "View logs" for raw data.
            </li>
          </ul>
        </div>
      </details>

      {auditData && timelines.length === 0 && !auditLoading && !auditError && (
        <div>No file history found.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {timelines.map((timeline: Timeline) => {
          const isExpanded = expandedItems.has(timeline.id);
          const firstAppearance = `Upload at ${
            timeline.path || '(path unavailable)'
          }`;
          const timestamp = formatTimestamp(timeline.first_appearance);

          return (
            <div key={timeline.id}>
              {/* summary box clickable */}
              <div
                className={styles.summaryBox}
                onClick={() => toggleExpanded(timeline.id)}
              >
                {/* filename on the left for each summary box */}
                <div className={styles.filenameSummaryBox}>
                  <Tooltip
                    title={getDisplayFileName(timeline, searchTerm)}
                    placement="top"
                  >
                    <span className={styles.clip}>
                      {getDisplayFileName(timeline, searchTerm)}
                    </span>
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
                    <span className={styles.value}>{timeline.user}</span>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.label}>Host:</span>
                    <span className={styles.value}>{timeline.host}</span>
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
                    operations={timeline.events}
                    filename={getDisplayFileName(timeline, searchTerm)}
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
