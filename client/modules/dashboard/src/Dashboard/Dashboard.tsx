import React, { useState } from 'react';
// import styles from './Dashboard.module.css';
import Quicklinks from './Quicklinks';
import JobStatus from './Jobstatus';
import { Table, Tag } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { useSystemOverview } from '@client/hooks';
import SUAllocationsCard from './SUAllocationsCard';
import UserGuides from './UserGuides';

export interface DashboardProps {}
interface HPCSystem {
  display_name: string;
  hostname: string;
  load_percentage: number;
  is_operational: boolean;
  running: number;
  waiting: number;
}
export function Dashboard(props: DashboardProps) {
  const { data: liveSystems, isLoading } = useSystemOverview();

  const [showJobs, setShowJobs] = useState(false);
  const [showAllocations, setShowAllocations] = useState(false);

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
      render: (load: number, record: HPCSystem) =>
        record.is_operational ? (
          `${load}%`
        ) : (
          <span style={{ color: '#999' }}>(N/A)</span>
        ),
    },
    {
      title: 'Running Jobs',
      dataIndex: 'running',
      key: 'running',
      render: (value: number, record: HPCSystem) =>
        record.is_operational ? (
          value
        ) : (
          <span style={{ color: '#999' }}>(N/A)</span>
        ),
    },
    {
      title: 'Waiting Jobs',
      dataIndex: 'waiting',
      key: 'waiting',
      render: (value: number, record: HPCSystem) =>
        record.is_operational ? (
          value
        ) : (
          <span style={{ color: '#999' }}>(N/A)</span>
        ),
    },
  ];

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      {/* Sidebar on the left */}
      <Quicklinks />

      {/* Middle section */}
      <div style={{ flex: 2 }}>
        <h1>DASHBOARD</h1>

        {/* Recent Jobs Collapsible Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3
            onClick={() => setShowJobs(!showJobs)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              userSelect: 'none',
            }}
          >
            {showJobs ? <DownOutlined /> : <RightOutlined />} Recent Jobs
          </h3>
          {showJobs && <JobStatus />}
        </div>

        {/* Allocations Collapsible Section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3
            onClick={() => setShowAllocations(!showAllocations)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              userSelect: 'none',
            }}
          >
            {showAllocations ? <DownOutlined /> : <RightOutlined />} Allocations
          </h3>
          {showAllocations && <SUAllocationsCard />}
        </div>
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
