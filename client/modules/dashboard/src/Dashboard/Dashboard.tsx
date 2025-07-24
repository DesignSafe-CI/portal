import React, { useState } from 'react';
import styles from './Dashboard.module.css';
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
          <span className={styles.naText}>(N/A)</span>
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
          <span className={styles.naText}>(N/A)</span>
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
          <span className={styles.naText}>(N/A)</span>
        ),
    },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <Quicklinks />

      <div className={styles.middleSection}>
        <h1>DASHBOARD</h1>

        {/* Recent Jobs */}
        <div className={styles.section}>
          <h3
            className={styles.sectionHeader}
            onClick={() => setShowJobs(!showJobs)}
          >
            {showJobs ? <DownOutlined /> : <RightOutlined />} Recent Jobs
          </h3>
          {showJobs && <JobStatus />}
        </div>

        {/* Allocations */}
        <div className={styles.section}>
          <h3
            className={styles.sectionHeader}
            onClick={() => setShowAllocations(!showAllocations)}
          >
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
  );
}

export default Dashboard;
