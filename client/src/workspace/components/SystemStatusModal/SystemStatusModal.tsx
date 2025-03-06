import React, { useState, useEffect } from 'react';
import { Tooltip, Spin, Alert } from 'antd';
import styles from './SystemStatusModal.module.css';

interface QueueData {
  name: string;
  running: number;
  waiting: number;
  backfill: number;
}

interface SystemInfo {
  name: string;
  host: string;
  queues: QueueData[];
  load: number;
  jobsRunning: number;
  jobsQueued: number;
  jobsBlocked: number;
}

const SystemStatusContent: React.FC = () => {
  const [activeSystem, setActiveSystem] = useState('frontera');
  const [statusData, setStatusData] = useState<Record<string, SystemInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        // Use TACC's actual endpoint
        const response = await fetch('/api/system-monitor/', {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch system status: ${response.status}`);
        }
        
        const data = await response.json();
        setStatusData(data.result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const systems = [
    { name: 'Frontera', host: 'frontera' },
    { name: 'Lonestar6', host: 'ls6' },
    { name: 'Stampede3', host: 'stampede3' }
  ];

  return (
    <div className={styles.modal}>
      <div className={styles.tabs}>
        {systems.map(({ name, host }) => (
          <button
            key={host}
            className={`${styles.tabButton} ${activeSystem === host ? styles.active : ''}`}
            onClick={() => setActiveSystem(host)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin />
          </div>
        ) : error ? (
          <Alert
            message="Error"
            description={`Failed to fetch system status: ${error}`}
            type="error"
            showIcon
          />
        ) : statusData[activeSystem] ? (
          <>
            <div className={styles.statusSection}>
              <div className={styles.statusRow}>
                <span>System Load:</span>
                <span>{statusData[activeSystem].load}%</span>
              </div>
              <div className={styles.statusRow}>
                <span>Jobs Running:</span>
                <span>{statusData[activeSystem].jobsRunning}</span>
              </div>
              <div className={styles.statusRow}>
                <span>Jobs in Queue:</span>
                <span>{statusData[activeSystem].jobsQueued}</span>
              </div>
            </div>
            {statusData[activeSystem].queues && (
              <div className={styles.queueSection}>
                <h4>Queues</h4>
                <div className={styles.queueTable}>
                  {statusData[activeSystem].queues.map(queue => (
                    <div key={queue.name} className={styles.queueRow}>
                      <span>{queue.name}</span>
                      <span>{queue.running}/{queue.waiting}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div>No data available for this system</div>
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
      overlayStyle={{ width: '300px' }}
    >
      <a className={styles.trigger}>System Status</a>
    </Tooltip>
  );
};

