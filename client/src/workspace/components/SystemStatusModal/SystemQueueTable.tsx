import React, { useEffect, useState } from 'react';
import { Spin, Alert, Badge } from 'antd';
import { useSystemQueue } from '../../../hooks/system-status/useSystemQueue';
import styles from './SystemQueueTable.module.css';

interface QueueItem {
  name: string;
  down: boolean;
  hidden: boolean;
  load: number;
  free: number;
  running: number;
  waiting: number;
}

interface SystemQueueTableProps {
  hostname: string;
}

export const SystemQueueTable: React.FC<SystemQueueTableProps> = ({
  hostname,
}) => {
  const [queueData, setQueueData] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  //Fetch data from useSystemQueue.ts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await useSystemQueue(hostname);
        setQueueData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hostname]);

  //Filter out any hidden queues
  const visibleQueues = queueData.filter((q) => !q.hidden);

  return (
    <>
      {loading ? (
        <div style={{ paddingTop: '40px', textAlign: 'center'}}>
          <Spin />
        </div>
      ) : error ? (
        <Alert
          message="Error"
          description={String(error)}
          type="error"
          showIcon
        />
      ) : queueData.length === 0 ? (
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

