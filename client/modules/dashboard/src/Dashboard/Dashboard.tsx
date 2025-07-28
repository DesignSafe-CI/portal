import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Collapse, Typography, Table, Tag } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';

import Quicklinks from './QuickLinksNavbar'; // Use one version only
import RecentlyAccessed from './RecentlyAccessed';
import RecentProjects from './RecentProjects';
import { TicketList } from './TicketList';
import JobStatus from './Jobstatus';
import { useSystemOverview } from '@client/hooks';
import SUAllocationsCard from './SUAllocationsCard';
import UserGuides from './UserGuides';

import styles from './Dashboard.module.css';

const { Text } = Typography;
const { Panel } = Collapse;

const queryClient = new QueryClient();

interface HPCSystem {
  display_name: string;
  hostname: string;
  load_percentage: number;
  is_operational: boolean;
  running: number;
  waiting: number;
}

export function Dashboard() {
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
        record.is_operational ? `${load}%` : <span className={styles.naText}>(N/A)</span>,
    },
    {
      title: 'Running Jobs',
      dataIndex: 'running',
      key: 'running',
      render: (value: number, record: HPCSystem) =>
        record.is_operational ? value : <span className={styles.naText}>(N/A)</span>,
    },
    {
      title: 'Waiting Jobs',
      dataIndex: 'waiting',
      key: 'waiting',
      render: (value: number, record: HPCSystem) =>
        record.is_operational ? value : <span className={styles.naText}>(N/A)</span>,
    },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <div className={styles.dashboardContainer}>
        <div className={styles.sidebar}>
          <Quicklinks />
        </div>

        <div className={styles.middleSection}>
          <h1>DASHBOARD</h1>

          <Collapse ghost expandIconPosition="end" className={styles.collapsibleSection}>
            <Panel header={<Text strong>Recent Projects</Text>} key="projects">
              <RecentProjects />
            </Panel>
            <Panel header={<Text strong>Recently Accessed Tools</Text>} key="recentlyAccessed">
              <RecentlyAccessed />
            </Panel>
            <Panel header={<Text strong>My Tickets</Text>} key="tickets">
              <TicketList />
            </Panel>
          </Collapse>

          {/* Recent Jobs */}
          <div className={styles.section}>
            <h3 className={styles.sectionHeader} onClick={() => setShowJobs(!showJobs)}>
              {showJobs ? <DownOutlined /> : <RightOutlined />} Recent Jobs
            </h3>
            {showJobs && <JobStatus />}
          </div>

          {/* Allocations */}
          <div className={styles.section}>
            <h3 className={styles.sectionHeader} onClick={() => setShowAllocations(!showAllocations)}>
              {showAllocations ? <DownOutlined /> : <RightOutlined />} Allocations
            </h3>
            {showAllocations && <SUAllocationsCard />}
          </div>
        </div>

        <div className={styles.verticalSeparator}></div>

        <div className={styles.rightPanel}>
          <div className={styles.statusCard}>
            <h3 className={styles.statusTitle}>System Status</h3>
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
