import React, { useState } from 'react';
import { Tooltip, Badge, Spin, Alert } from 'antd';
import { SystemQueueTable } from './SystemQueueTable';
import { useSystemOverview } from '../../../hooks/system-status/useSystemOverview'; 
import styles from './SystemStatusModal.module.css';

const SystemStatusContent: React.FC = () => {
  const [activeSystem, setActiveSystem] = useState('frontera'); //default system


  const { systems, loading, error } = useSystemOverview(); 

  const selectedSystem = systems.find(
    (sys) => sys.display_name.toLowerCase() === activeSystem.toLowerCase()
  );

 
  //setting color for status of system
  const getStatusColor = (system: typeof selectedSystem) => {
    if (!system) return 'default';
    if (!system.is_operational) return 'success';
    if (!system.in_maintenance) return 'warning';
    return 'success'; 
  };




  return (
    <div className={styles.modal}>
      {/* System selection tabs */}
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

      {/* Main content area */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin />
          </div>
        ) : error ? (
          <Alert message="Error" description={error} type="error" showIcon />
        ) : selectedSystem ? (
          <>
            {/* Top-level system overview */}
            <div className={styles.statusHeader}>
              <h3>{selectedSystem.display_name.toUpperCase()}</h3>
              <Badge
                status={getStatusColor(selectedSystem)}
                text={selectedSystem.is_operational ? 'Operational' : 'Not Operational'}
              />
            </div>

            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <div className={styles.statusLabel}>Load</div>
                <div className={styles.statusValue}>
                  {selectedSystem.load_percentage}%
                </div>
              </div>
              <div className={styles.statusItem}>
                <div className={styles.statusLabel}>Running Jobs</div>
                <div className={styles.statusValue}>
                  {selectedSystem.jobs.running}
                </div>
              </div>
              <div className={styles.statusItem}>
                <div className={styles.statusLabel}>Waiting Jobs</div>
                <div className={styles.statusValue}>
                  {selectedSystem.jobs.queued}
                </div>
              </div>
            </div>

            {/* Queue table section */}
            <div>
              <SystemQueueTable hostname={activeSystem} />
            </div>
          </>
        ) : (
          <div>No data found for {activeSystem}</div>
        )}
      </div>
    </div>
  );
};

export const SystemStatusModal: React.FC = () => {
  return (
    <Tooltip
      title={<SystemStatusContent />}
      trigger="hover"
      placement="bottomRight"
      color="white"
      overlayInnerStyle={{ padding: 0 }}
      overlayStyle={{ maxWidth: '400px' }}
    >
      <a className={styles.trigger}>System Status</a>
    </Tooltip>
  );
};