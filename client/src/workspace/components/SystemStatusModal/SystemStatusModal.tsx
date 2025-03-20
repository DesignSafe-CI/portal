import React, { useState } from 'react';
import { Modal, Badge, Spin, Alert} from 'antd';
import { SystemQueueTable } from './SystemQueueTable';
import { useSystemOverview } from '../../../hooks/system-status/useSystemOverview';
import styles from './SystemStatusModal.module.css';

interface SystemStatusModalProps {
  isModalVisible: boolean;
  onClose: () => void;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({
  isModalVisible,
  onClose,
}) => {
  const [activeSystem, setActiveSystem] = useState('Stampede3');

  const { data: systems, isLoading, isError, error } = useSystemOverview();

  const selectedSystem = systems?.find(
    (sys) => sys.display_name.toLowerCase() === activeSystem.toLowerCase()
  );

  //setting color for status of system
  const getStatusColor = (system: typeof selectedSystem) => {
    if (system?.is_operational) return 'success';
    if (system?.in_maintenance) return 'warning';
    return 'error';
  };

  return (
    <Modal
      title="System Status"
      open={isModalVisible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <div className={styles.modal}>
        <div className={styles.tabs}>
          {['frontera', 'lonestar6', 'Stampede3'].map((hostname) => (
            <button
              key={hostname}
              className={`${styles.tabButton} ${
                activeSystem === hostname ? styles.activeTab : ''
              }`}
              onClick={() => setActiveSystem(hostname)}
            >
              {hostname.toUpperCase()}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <Spin />
            </div>
          ) : error ? (
            <Alert
              message="Error"
              description={String(error)}
              type="error"
              showIcon
            />
          ) : selectedSystem ? (
            <>
              <div className={styles.statusHeader}>
                <h3>{selectedSystem.display_name.toUpperCase()}</h3>
                <Badge
                  status={getStatusColor(selectedSystem)}
                  text={
                    selectedSystem.is_operational
                      ? 'Operational'
                      : 'Maintenance'
                  }
                />
              </div>

              <div className={styles.statusGrid}>
                <div className={styles.statusItem}>
                  <div className={styles.statusLabel}>Load</div>
                  <div className={styles.statusValue}>
                    {selectedSystem.load_percentage != null
                      ? `${selectedSystem.load_percentage}%`
                      : '--'}
                  </div>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusLabel}>Running Jobs</div>
                  <div className={styles.statusValue}>
                    {selectedSystem.running != null
                      ? selectedSystem.running
                      : '--'}
                  </div>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusLabel}>Waiting Jobs</div>
                  <div className={styles.statusValue}>
                    {selectedSystem.waiting != null
                      ? selectedSystem.waiting
                      : '--'}
                  </div>
                </div>
              </div>

              <div className={styles.tableContainer}>
                <SystemQueueTable hostname={activeSystem} />
              </div>
            </>
          ) : (
            <div>No data found for {activeSystem}</div>
          )}
        </div>
      </div>
    </Modal>
  );
};
