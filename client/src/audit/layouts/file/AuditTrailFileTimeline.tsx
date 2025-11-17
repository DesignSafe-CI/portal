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
import styles from '../../AuditTrail.module.css';
import { TimelineEvent } from '@client/hooks';
import {
  formatTimestamp,
  getActionDetails,
  isHighlightOperation,
} from '../../utils';

interface TimelineProps {
  operations: TimelineEvent[];
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
      default:
        return <ArrowRightOutlined className={styles.icon} />;
    }
  };

  const handleViewLogs = (operation: TimelineEvent) => {
    setModalContent(JSON.stringify(operation, null, 2));
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalContent('');
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
                  const highlight = isHighlightOperation(operation, searchTerm);
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
