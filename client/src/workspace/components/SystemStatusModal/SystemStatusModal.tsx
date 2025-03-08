import React, { useState, useEffect } from 'react';
import { Tooltip, Spin, Alert, Badge } from 'antd';
import styles from './SystemStatusModal.module.css';

//Interfaces for the data
interface SystemData {
  name: string;
  host: string;
  load: number;
  jobsRunning: number;
  jobsQueued: number;
  status: 'UP' | 'DOWN' | 'MAINTENANCE' | 'UNKNOWN';
}

//Mock data 
const mockSystems: SystemData[] = [
  {
    name: 'Frontera',
    host: 'frontera',
    load: 8,
    jobsRunning: 150,
    jobsQueued: 25,
    status: 'UP'
  },
  {
    name: 'Lonestar6',
    host: 'ls6',
    load: 70,
    jobsRunning: 100,
    jobsQueued: 15,
    status: 'UP'
  },
  {
    name: 'Stampede3',
    host: 'stampede3',
    load: 90,
    jobsRunning: 200,
    jobsQueued: 30,
    status: 'MAINTENANCE'
  }
];

const SystemStatusContent: React.FC = () => {
  const [activeSystem, setActiveSystem] = useState('frontera');
  const [systems, setSystems] = useState<SystemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        // Comment out the fetch call temporarily
        const response = await fetch('/api/system-monitor/systems/');
        const data = await response.json();
        
        // Use mock data instead
        setSystems(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  //Get the currently selected system
  const selectedSystem = systems.find(system => system.host === activeSystem);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'UP': return 'success';
      case 'DOWN': return 'error';
      case 'MAINTENANCE': return 'warning';
      default: return 'default';
    }
  };

  return (
    <div className={styles.modal}>
      {/* Tabs at the top for system selection */}
      <div className={styles.tabs}>
        {systems.map(system => (
          <button
            key={system.host}
            className={`${styles.tabButton} ${activeSystem === system.host ? styles.activeTab : ''}`}
            onClick={() => setActiveSystem(system.host)}
          >
            {system.name}
          </button>
        ))}
      </div>
      
      {/* Content area */}
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
        ) : selectedSystem ? (
          <>
            <div className={styles.statusHeader}>
              <h3>{selectedSystem.name}</h3>
              <Badge 
                status={getStatusColor(selectedSystem.status)} 
                text={selectedSystem.status === 'UP' ? 'Operational' : selectedSystem.status} 
              />
            </div>
            
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <div className={styles.statusLabel}>Load</div>
                <div className={styles.statusValue}>{selectedSystem.load}%</div>
              </div>
              <div className={styles.statusItem}>
                <div className={styles.statusLabel}>Running Jobs</div>
                <div className={styles.statusValue}>{selectedSystem.jobsRunning}</div>
              </div>
              <div className={styles.statusItem}>
                <div className={styles.statusLabel}>Waiting Jobs</div>
                <div className={styles.statusValue}>{selectedSystem.jobsQueued}</div>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>No system data available</div>
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