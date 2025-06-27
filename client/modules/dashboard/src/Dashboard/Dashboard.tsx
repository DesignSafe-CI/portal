import React from 'react';
import styles from './Dashboard.module.css';
import Quicklinks from './Quicklinks';
import JobStatus from './Jobstatus';
import { Table, Tag } from 'antd';
import { useSystemOverview } from '@client/hooks';
import SUAllocationsCard from './SUAllocationsCard';
import UserGuides from './UserGuides';

export interface DashboardProps {}

export function Dashboard(props: DashboardProps) {
  const { data: liveSystems, isLoading } = useSystemOverview();

  const columns = [
    {
      title: 'System Name',
      dataIndex: 'display_name',
      key: 'name',
    },
    {
      title: 'Status',
      dataIndex: 'is_operational',
      key: 'status',
      render: (isOperational: boolean) => (
        <Tag color={isOperational ? 'green' : 'red'}>
          {isOperational ? 'UP' : 'DOWN'}
        </Tag>
      ),
    },
    {
      title: 'Load',
      dataIndex: 'load_percentage',
      key: 'load',
      render: (load: number) => `${load}%`,
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
        <SUAllocationsCard />
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

      {/* Right side panel: System Status + Videos */}
      <div style={{ flex: 1.3, paddingRight: '1.5rem' }}>
        <div
          style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            marginBottom: '1.5rem',
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

        {/* YouTube Section */}
        <UserGuides />
      </div>
    </div>
  );
}

export default Dashboard;
