import React, { useState, useEffect } from 'react';
import { Modal, Spin, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { SystemQueueTable } from './SystemQueueTable';
import { useSystemOverview, useGetApps } from '@client/hooks';
import {
  useGetAppParams,
  getDefaultExecSystem,
  getExecSystemsFromApp,
  getSystemDisplayName,
} from '@client/workspace';
import styles from './SystemStatusModal.module.css';

interface SystemStatusModalProps {
  isModalVisible: boolean;
  onClose: () => void;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({
  isModalVisible,
  onClose,
}) => {
  //suspense keeps giving errors, so using useGetApps instead
  const { appId, appVersion } = useGetAppParams();
  const { data: app } = useGetApps({ appId: appId || '', appVersion });
  console.log(app?.definition.jobAttributes.execSystemId);
  const { data: systemsData } = useQuery({
    queryKey: ['workspace', 'getSystems'],
    queryFn: async () => {
      const response = await fetch('/api/workspace/systems');
      const data = await response.json();
      return data.response;
    },
    staleTime: 1000 * 60 * 5,
  });

  const [activeSystem, setActiveSystem] = useState('Frontera');

  useEffect(() => {
    if (app && appId && systemsData?.executionSystems) {
      const appExecSystems = getExecSystemsFromApp(
        app.definition,
        systemsData.executionSystems
      );
      const defaultExecSystem = getDefaultExecSystem(
        app.definition,
        appExecSystems
      );

      if (defaultExecSystem?.id) {
        setActiveSystem(getSystemDisplayName(defaultExecSystem.id));
      }
    }
  }, [app, appId, systemsData]);

  const { data: systems, isLoading, error } = useSystemOverview();
  const selectedSystem = systems?.find(
    (sys) => sys.display_name === activeSystem
  );

  return (
    <Modal
      title="System Status"
      open={isModalVisible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: '230px' }}
    >
      <div className={styles.modal}>
        <div className={styles.tabs}>
          {systems?.map((sys) => (
            <button
              key={sys.display_name}
              className={`${styles.tabButton} ${
                activeSystem === sys.display_name ? styles.activeTab : ''
              }`}
              onClick={() => setActiveSystem(sys.display_name)}
            >
              {sys.display_name}
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
            <div>No data found for {activeSystem}</div>
          )}
        </div>
      </div>
    </Modal>
  );
};
