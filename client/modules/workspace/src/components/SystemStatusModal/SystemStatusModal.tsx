import React, { useState, useEffect, Suspense } from 'react';
import { Modal, Spin, Alert } from 'antd';
import { SystemQueueTable } from './SystemQueueTable';
import { useSystemOverview, useGetApps, useGetSystems } from '@client/hooks';
import {
  useGetAppParams,
  getDefaultExecSystem,
  getExecSystemsFromApp,
  getSystemDisplayName,
} from '../../utils/apps';
import styles from './SystemStatusModal.module.css';

interface SystemStatusModalProps {
  isModalVisible: boolean;
  onClose: () => void;
}

const SystemStatusContent: React.FC<SystemStatusModalProps> = ({
  isModalVisible,
  onClose,
}) => {
  const { appId, appVersion } = useGetAppParams();
  const { data: app } = useGetApps({ appId: appId || '', appVersion });

  const {
    data: { executionSystems },
  } = useGetSystems();

  const [activeSystem, setActiveSystem] = useState('Vista');

  useEffect(() => {
    if (app && appId && executionSystems) {
      const appExecSystems = getExecSystemsFromApp(
        app.definition,
        executionSystems
      );
      const defaultExecSystem = getDefaultExecSystem(
        app.definition,
        appExecSystems
      );

      if (defaultExecSystem && defaultExecSystem?.id) {
        setActiveSystem(getSystemDisplayName(defaultExecSystem.id));
      }
    }
  }, [app, appId, executionSystems]);

  const { data: systems, isLoading, error } = useSystemOverview();
  const availableSystems =
    systems?.map((sys) => sys.display_name)?.sort() || [];
  const selectedSystem = systems?.find(
    (sys) => sys.display_name === activeSystem
  );

  useEffect(() => {
    if (systems && !availableSystems.includes(activeSystem)) {
      setActiveSystem(availableSystems[0] || 'Frontera');
    }
  }, [systems, activeSystem]);

  return (
    <Modal
      title="System Status"
      open={isModalVisible}
      onCancel={onClose}
      footer={null}
      width={800}
      className={styles.modalContainer}
    >
      <div className={styles.modal}>
        <div className={styles.tabs}>
          {availableSystems.map((systemName) => (
            <button
              key={systemName}
              className={`${styles.tabButton} ${
                activeSystem === systemName ? styles.activeTab : ''
              }`}
              onClick={() => setActiveSystem(systemName)}
            >
              {systemName}
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
                <div className={styles.statusTitleContainer}>
                  <span className={styles.statusTitle}>
                    {selectedSystem.display_name} Status:
                  </span>
                  <div
                    className={`${styles.statusBadge} ${
                      selectedSystem.is_operational
                        ? styles.open
                        : styles.closed
                    }`}
                  >
                    {selectedSystem.is_operational
                      ? 'Operational'
                      : 'Maintenance'}
                  </div>
                </div>
              </div>
              <div className={styles.tableContainer}>
                <SystemQueueTable hostname={activeSystem} />
              </div>
            </>
          ) : (
            <div>No data found</div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export const SystemStatusModal: React.FC<SystemStatusModalProps> = (props) => {
  return (
    <Suspense fallback={<Spin />}>
      <SystemStatusContent {...props} />
    </Suspense>
  );
};
