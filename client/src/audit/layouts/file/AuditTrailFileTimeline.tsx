import React, { useState } from 'react';
import { Modal } from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  EditOutlined,
  SwapOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
//not sure what would be the best thing to use here for the icons
import styles from '../../AuditTrail.module.css';
import { PortalFileAuditEntry } from '@client/hooks';

type DataObj = {
  path?: string;
  body?: {
    file_name?: string;
    new_name?: string;
    dest_path?: string;
    trash_path?: string;
  };
};

interface TimelineProps {
  operations: PortalFileAuditEntry[];
  filename: string;
  searchTerm?: string;
}

const AuditTrailFileTimeline: React.FC<TimelineProps> = ({
  operations,
  filename,
  searchTerm,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');

  //using in filetable as well, maybe move to another file?
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

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'upload':
        return <UploadOutlined className={styles.icon} />;
      case 'download':
        return <DownloadOutlined className={styles.icon} />;
      case 'rename':
        return <EditOutlined className={styles.icon} />;
      case 'move':
        return <SwapOutlined className={styles.icon} />;
      case 'delete':
      case 'trash':
        return <DeleteOutlined className={styles.icon} />;
      default: //don't think I need because all actions possible in query are already accounted for
        return <ArrowRightOutlined className={styles.icon} />;
    }
  };

  const getActionDetails = (operation: PortalFileAuditEntry) => {
    const { action } = operation;
    const dataObj: DataObj | undefined =
      typeof operation.data === 'string'
        ? undefined
        : (operation.data as DataObj);

    switch (action.toLowerCase()) {
      case 'upload':
        return {
          source: 'N/A',
          destination: dataObj?.path || 'N/A',
        };
      case 'rename':
        return {
          source: dataObj?.path || 'N/A',
          destination: dataObj?.body?.new_name || 'N/A',
        };
      case 'move':
        return {
          source: dataObj?.path || 'N/A',
          destination: dataObj?.body?.dest_path || 'N/A',
        };
      case 'trash':
        return {
          source: dataObj?.path || 'N/A',
          destination: dataObj?.body?.trash_path || 'N/A',
        };
      default:
        return {
          source: 'Unknown',
          destination: 'Unknown',
        };
    }
  };

  const handleViewLogs = (operation: PortalFileAuditEntry) => {
    setModalContent(JSON.stringify(operation, null, 2));
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalContent('');
  };

  const isHighlightOperation = (operation: PortalFileAuditEntry): boolean => {
    const term = (searchTerm || '').toLowerCase();
    if (!term) return false;
    const action = (operation?.action || '').toLowerCase();
    const body =
      typeof operation.data === 'string'
        ? {}
        : (operation.data as DataObj).body || {};
    if (action === 'upload') {
      const fileName = (body?.file_name || '').toLowerCase();
      return fileName === term;
    }
    if (action === 'rename') {
      const newName = (body?.new_name || '').toLowerCase();
      return newName === term;
    }
    return false;
  };

  return (
    <>
      <Modal
        title="Details"
        open={modalOpen}
        onCancel={handleModalClose}
        footer={null}
        centered
        width={550}
      >
        <pre className={styles.modalContent}>{modalContent}</pre>
      </Modal>

      <div className={styles.timelineDropDown}>
        <h4
          style={{
            marginBottom: '25px',
            textAlign: 'center',
          }}
        >
          File Timeline: {filename}
        </h4>

        <div className={styles.timelineContainer}>
          <div className={styles.nodeLine}></div>
          {operations.map((operation, index) => {
            const actionDetails = getActionDetails(operation);

            return (
              // timeline excluding info box
              <div className={styles.timeline} key={index}>
                {/* Timestamp details */}
                <div className={styles.timestamp}>
                  <div style={{ fontWeight: 'bold' }}>
                    {formatTimestamp(operation.timestamp)}
                  </div>
                </div>
                <div
                  className={styles.lineToNode}
                  style={{ marginRight: '12px' }}
                ></div>
                {/* Operation Node */}
                {(() => {
                  const highlight = isHighlightOperation(operation);
                  return (
                    <div
                      className={styles.node}
                      style={{
                        border: highlight
                          ? '3px solid #ff4d4f'
                          : '3px solid black',
                      }}
                    >
                      <div>{getActionIcon(operation.action)}</div>
                      <div //icon text
                        style={{
                          fontSize: '11px',
                          marginTop: '8px',
                          fontWeight: 'bold',
                        }}
                      >
                        {operation.action.toUpperCase()}
                      </div>
                    </div>
                  );
                })()}

                <div
                  className={styles.lineToNode}
                  style={{ marginLeft: '12px' }}
                ></div>

                {/* Right Details(Info) Box */}
                <div className={styles.infoBox}>
                  {/* Action Section */}
                  <div style={{ marginBottom: '20px' }}>
                    <div className={styles.headerInfoBox}>Action</div>
                    <div style={{ fontSize: '13px' }}>
                      {operation.action.charAt(0).toUpperCase() +
                        operation.action.slice(1)}
                    </div>
                  </div>

                  {/* File Details Section */}
                  <div style={{ marginBottom: '20px' }}>
                    <div className={styles.headerInfoBox}>File Details</div>
                    <div>
                      <span style={{ fontSize: '13px' }}>Source:</span>
                      <span className={styles.textInfoBox}>
                        {actionDetails.source}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px' }}>Destination:</span>
                      <span className={styles.textInfoBox}>
                        {actionDetails.destination}
                      </span>
                    </div>
                  </div>

                  {/* User Info Section */}
                  <div style={{ marginBottom: '20px' }}>
                    <div className={styles.headerInfoBox}>User Information</div>
                    <div>
                      <span style={{ fontSize: '13px' }}>User:</span>
                      <span className={styles.textInfoBox}>
                        {operation.username}
                      </span>
                    </div>
                  </div>

                  {/* View Logs Link */}
                  <div style={{ marginTop: '25px' }}>
                    <span
                      className={styles.viewLogsLink}
                      onClick={() => handleViewLogs(operation)}
                    >
                      View logs
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default AuditTrailFileTimeline;
