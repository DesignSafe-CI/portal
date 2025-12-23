import React, { useState } from 'react';
import { Modal } from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  EditOutlined,
  SwapOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import styles from '../../AuditTrail.module.css';
import { TimelineEvent } from '@client/hooks';
import {
  formatTimestamp,
  isHighlightOperation,
  getSourcePath,
  getTargetPath,
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

  const getDetailValue = (op: TimelineEvent, key: string) => {
    return (op as any)[key] || (op.details as any)[key] || 'N/A';
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'upload':
        return <UploadOutlined className={styles.icon} />;
      case 'download':
        return <DownloadOutlined className={styles.icon} />;
      case 'rename':
        return <EditOutlined className={styles.icon} />;
      case 'submitjob':
        return <PlayCircleOutlined className={styles.icon} />;
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

                  {/* Details Section */}
                  <div style={{ marginBottom: '20px' }}>
                    <div className={styles.headerInfoBox}>Details</div>

                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          marginBottom: '4px',
                          fontWeight: 'bold',
                        }}
                      >
                        Parent Tracking ID
                      </div>
                      <div
                        className={styles.textInfoBox}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {getDetailValue(operation, 'parent_tracking_id')}
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          marginBottom: '4px',
                          fontWeight: 'bold',
                        }}
                      >
                        Tracking ID
                      </div>
                      <div
                        className={styles.textInfoBox}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {getDetailValue(operation, 'tracking_id')}
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          marginBottom: '4px',
                          fontWeight: 'bold',
                        }}
                      >
                        Source Tapis System
                      </div>
                      <div
                        className={styles.textInfoBox}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {getDetailValue(operation, 'source_system_id')}
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          marginBottom: '4px',
                          fontWeight: 'bold',
                        }}
                      >
                        Source Host
                      </div>
                      <div
                        className={styles.textInfoBox}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {getDetailValue(operation, 'source_host')}
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          marginBottom: '4px',
                          fontWeight: 'bold',
                        }}
                      >
                        Source Path
                      </div>
                      <div
                        className={styles.textInfoBox}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {getSourcePath(operation)}
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          marginBottom: '4px',
                          fontWeight: 'bold',
                        }}
                      >
                        Target Tapis System
                      </div>
                      <div
                        className={styles.textInfoBox}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {getDetailValue(operation, 'target_system_id')}
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          marginBottom: '4px',
                          fontWeight: 'bold',
                        }}
                      >
                        Target Host
                      </div>
                      <div
                        className={styles.textInfoBox}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {getDetailValue(operation, 'target_host')}
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div
                        style={{
                          fontSize: '13px',
                          marginBottom: '4px',
                          fontWeight: 'bold',
                        }}
                      >
                        Target Path
                      </div>
                      <div
                        className={styles.textInfoBox}
                        style={{ wordBreak: 'break-word' }}
                      >
                        {getTargetPath(operation)}
                      </div>
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
