import React, { useState } from 'react';
import { Spin, Alert } from 'antd';
import { StatusTag, SystemStatusModal } from '@client/workspace';
import { useSystemOverview } from '@client/hooks';
import styles from './SystemStatus.module.css';

export const SystemStatus: React.FC = () => {
  const { data: liveSystems, isLoading, error } = useSystemOverview();
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <>
      {isLoading ? (
        <div style={{ paddingTop: '40px', textAlign: 'center' }}>
          <Spin />
        </div>
      ) : error ? (
        <Alert
          message="Error"
          description={String(error)}
          type="error"
          showIcon
        />
      ) : !liveSystems || liveSystems.length === 0 ? (
        <div className={styles.systemUnavailable}>Data not available</div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <span
              className={styles.viewDetailsLink}
              onClick={() => setIsModalVisible(true)}
            >
              View Details
            </span>
            <table className={styles.systemTable}>
              <thead>
                <tr>
                  <th className={styles.systemNameCol}>System</th>
                  <th className={styles.statusCol}>Status</th>
                  <th className={styles.numericCol}>Load</th>
                  <th className={styles.numericCol}>Running Jobs</th>
                  <th className={styles.numericCol}>Waiting Jobs</th>
                </tr>
              </thead>
              <tbody>
                {liveSystems.map((system) => (
                  <tr key={system.hostname}>
                    <td className={styles.systemNameCol}>
                      {system.display_name}
                    </td>
                    <td className={styles.statusCol}>
                      <StatusTag
                        variant={system.is_operational ? 'open' : 'error'}
                      >
                        {system.is_operational ? 'Open' : 'Closed'}
                      </StatusTag>
                    </td>
                    <td className={styles.numericCol}>
                      {system.is_operational
                        ? `${system.load_percentage}%`
                        : '(N/A)'}
                    </td>
                    <td className={styles.numericCol}>
                      {system.is_operational ? system.running : '(N/A)'}
                    </td>
                    <td className={styles.numericCol}>
                      {system.is_operational ? system.waiting : '(N/A)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <SystemStatusModal
            isModalVisible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
          />
        </>
      )}
    </>
  );
};
