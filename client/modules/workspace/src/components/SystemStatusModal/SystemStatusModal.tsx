import React, { useState, useEffect } from 'react';
import { Modal, Spin, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { SystemQueueTable } from './SystemQueueTable';
import { useSystemOverview, useGetApps } from '@client/hooks';
import { useGetAppParams, getDefaultExecSystem, getExecSystemsFromApp, getSystemDisplayName } from '@client/workspace';
import styles from './SystemStatusModal.module.css';

interface SystemStatusModalProps {
  isModalVisible: boolean;
  onClose: () => void;
}

export const SystemStatusModal: React.FC<SystemStatusModalProps> = ({
  isModalVisible,
  onClose,
}) => {
  const { appId, appVersion } = useGetAppParams();//getting app id and version from url in DS to pass to useGetApps
  const { data: app } = useGetApps({ appId: appId || '', appVersion }); //getting app data from appId and appVersion barely defined above to show default system for that app 
  console.log(app?.definition.jobAttributes.execSystemId);
  //Suspense keeps giving me errors and not too sure if im doing it right, so I'm using useQuery to get the systems data
  const { data: systemsData } = useQuery({
    queryKey: ['workspace', 'getSystems'],
    queryFn: async () => {
      const response = await fetch('/api/workspace/systems');//getting systems data 
      const data = await response.json();
      return data.response;
    },
    staleTime: 1000 * 60 * 5,//5 minutes
  });

  const [activeSystem, setActiveSystem] = useState('Frontera');

  //Setting  default system from app when data is ready
  useEffect(() => {
    if (app && appId && systemsData?.executionSystems) { //if app is defined(app data from useGetApps), appId is defined (from url), and systemsData is defined(from useQuery), then get the default system for that app
      const appExecSystems = getExecSystemsFromApp(app.definition, systemsData.executionSystems);//returns the exec systems for the app, these are the actual systems that the app can run on
      const defaultExecSystem = getDefaultExecSystem(app.definition, appExecSystems);//passing dict appExecSystems adn app.definition to get the default exec system for the app, will return system dict with all the info for the default system
      
      if (defaultExecSystem?.id) {
        setActiveSystem(getSystemDisplayName(defaultExecSystem.id));
      }
    }
  }, [app, appId, systemsData]);

  const { data: systems, isLoading, error } = useSystemOverview();
  const selectedSystem = systems?.find(sys => sys.display_name === activeSystem);

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
