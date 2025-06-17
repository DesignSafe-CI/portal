import React from 'react';
import styles from './Dashboard.module.css';
import Quicklinks from './Quicklinks';
import JobStatus from './Jobstatus';
import { Table, Tag } from 'antd';
import { useGetLiveSystemStatus } from '../../../_hooks/src/systems/useGetLiveSystemStatus';

export interface DashboardProps {}

export function Dashboard(props: DashboardProps) {
  const { data: liveSystems, isLoading } = useGetLiveSystemStatus();

  const columns = [
    {
      title: 'System Name',
      dataIndex: 'display_name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'online',
      key: 'status',
      render: (online: boolean) => (
        <Tag color={online ? 'green' : 'red'}>{online ? 'UP' : 'DOWN'}</Tag>
      ),
    },
    {
      title: 'Load',
      dataIndex: 'load',
      key: 'load',
      render: (load: number) => `${Math.round(load * 100)}%`,
    },
    {
      title: 'Running Jobs',
      dataIndex: 'running',
      key: 'running',
    },
    {
      title: 'Waiting Jobs',
      dataIndex: 'waiting',
      key: 'waiting',
    },
  ];

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      {/* Sidebar on the left */}
      <Quicklinks />

      {/* Middle section */}
      <div style={{ flex: 2 }}>
        <h1>DASHBOARD</h1>
        <JobStatus />
      </div>
      {/* Vertical separator */}
      <div
        style={{
          width: '1px',
          backgroundColor: '#ccc',
          marginTop: '2.5rem',
          marginBottom: '2rem',
          height: 'auto',
          minHeight: '300px',
        }}
      ></div>

      {/* System Status on the right */}
      <div style={{ flex: 1.3, paddingRight: '1.5rem' }}>
        <div
          style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          }}
        >
          <h3 style={{ marginBottom: '1rem' }}>System Status</h3>
          <Table
            columns={columns}
            dataSource={liveSystems?.map((sys) => ({
              key: sys.hostname,
              ...sys,
            }))}
            loading={isLoading}
            size="small"
            pagination={false}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
