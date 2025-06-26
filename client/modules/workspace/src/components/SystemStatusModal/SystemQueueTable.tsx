import React from 'react';
import { Spin, Alert } from 'antd';
import { useSystemQueue } from '@client/hooks';

import styles from './SystemQueueTable.module.css';

interface SystemQueueTableProps {
  hostname: string;
}

export const SystemQueueTable: React.FC<SystemQueueTableProps> = ({
  hostname,
}) => {
  const { data: queueData, isLoading, error } = useSystemQueue(hostname);

  const visibleQueues = (queueData ?? []).filter((q) => !q.hidden);

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
      ) : !queueData || queueData.length === 0 ? (
        <div className={styles.queueUnavailable}>Data not available</div>
      ) : (
        <table className={styles.queueTable}>
          <thead>
            <tr>
              <th>Queue</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th>Idle Nodes</th>
              <th>Running Jobs</th>
              <th>Waiting Jobs</th>
            </tr>
          </thead>
          <tbody>
            {visibleQueues.map((queue, idx) => (
              <tr key={idx}>
                <td>{queue.name}</td>
                <td>
                  <div
                    className={`${styles.statusBadge} ${
                      queue.down ? styles.closed : styles.open
                    }`}
                  >
                    {queue.down ? 'Closed' : 'Open'}
                  </div>
                </td>
                <td>{queue.free}</td>
                <td>{queue.running}</td>
                <td>{queue.waiting}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};
