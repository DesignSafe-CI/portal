import React, { useState } from 'react';
import Quicklinks from './Quicklinks';
import JobStatus from './Jobstatus';
import { Table, Tag } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { useSystemOverview } from '@client/hooks';
import SUAllocationsCard from './SUAllocationsCard';
import UserGuides from './UserGuides';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RecentProjects from './RecentProjects';
import RecentlyAccessed from './RecentlyAccessed';
import { TicketList } from './TicketList';

export interface DashboardProps {}

const queryClient = new QueryClient();

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

  const [expandedSections, setExpandedSections] = useState({
    recentProjects: false,
    recentlyAccessed: false,
    ticketList: false,
  });

  const [showJobs, setShowJobs] = useState(false);
  const [showAllocations, setShowAllocations] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
        record.is_operational ? `${load}%` : <span style={{ color: '#999' }}>(N/A)</span>,
    },
    {
      title: 'Running Jobs',
      dataIndex: 'running',
      key: 'running',
      render: (value: number, record: HPCSystem) =>
        record.is_operational ? value : <span style={{ color: '#999' }}>(N/A)</span>,
    },
    {
      title: 'Waiting Jobs',
      dataIndex: 'waiting',
      key: 'waiting',
      render: (value: number, record: HPCSystem) =>
        record.is_operational ? value : <span style={{ color: '#999' }}>(N/A)</span>,
    },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <Quicklinks />

        <div style={{ flex: 2 }}>
          <h1>DASHBOARD</h1>

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

          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              onClick={() => toggleSection('recentProjects')}
              style={{ cursor: 'pointer' }}
            >
              {expandedSections.recentProjects ? '▼' : '▶'} Recent Projects
            </h3>
            {expandedSections.recentProjects && <RecentProjects />}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              onClick={() => toggleSection('recentlyAccessed')}
              style={{ cursor: 'pointer' }}
            >
              {expandedSections.recentlyAccessed ? '▼' : '▶'} Recently Accessed Tools
            </h3>
            {expandedSections.recentlyAccessed && <RecentlyAccessed />}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3
              onClick={() => toggleSection('ticketList')}
              style={{ cursor: 'pointer' }}
            >
              {expandedSections.ticketList ? '▼' : '▶'} My Tickets
            </h3>
            {expandedSections.ticketList && <TicketList />}
          </div>
        </div>

        <div
          style={{
            flex: 1.3,
            paddingRight: '1.5rem',
            borderLeft: '1px solid #ccc',
            paddingLeft: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '1.5rem',
              borderRadius: '8px',
              border: '1px solid #E0E0E0',
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

          <UserGuides />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default Dashboard;
