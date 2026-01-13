import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import Quicklinks from '../QuickLinks/QuickLinksNavbar';
import RecentlyAccessed from '../RecentlyAccessed/RecentlyAccessed';
import RecentProjects from '../RecentProjects/RecentProjects';
import { TicketList } from '../TicketList/TicketList';
import { SystemStatus } from '../SystemStatus/SystemStatus';
import JobStatus from '../JobStatus/JobStatus';
import SUAllocationsCard from '../SUAllocationsCard/SUAllocationsCard';
import UserGuides from '../UserGuides/UserGuides';
import styles from './Dashboard.module.css';

const queryClient = new QueryClient();

export function Dashboard() {
  const [showJobs, setShowJobs] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [showAllocations, setShowAllocations] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className={styles.dashboardContainer}>
        {/* Sidebar */}
        <Quicklinks />

        {/* Middle Section */}
        <div className={styles.middleSection}>
          <h1>Dashboard</h1>

          {/* Recent Jobs */}
          <div className={styles.section}>
            <h3
              className={styles.sectionHeader}
              onClick={() => setShowJobs(!showJobs)}
            >
              {showJobs ? <DownOutlined /> : <RightOutlined />} Recent Jobs
            </h3>
            {showJobs && (
              <div className={styles.statusCard}>
                <JobStatus />
              </div>
            )}
          </div>

          {/* Recent Projects */}
          <div className={styles.section}>
            <h3
              className={styles.sectionHeader}
              onClick={() => setShowProjects(!showProjects)}
            >
              {showProjects ? <DownOutlined /> : <RightOutlined />} Recent
              Projects
            </h3>
            {showProjects && (
              <div className={styles.statusCard}>
                <RecentProjects />
              </div>
            )}
          </div>

          {/* My Tickets */}
          <div className={styles.section}>
            <h3
              className={styles.sectionHeader}
              onClick={() => setShowTickets(!showTickets)}
            >
              {showTickets ? <DownOutlined /> : <RightOutlined />} My Tickets
            </h3>
            {showTickets && (
              <div className={styles.statusCard}>
                <TicketList />
              </div>
            )}
          </div>

          {/* Allocations */}
          <div className={styles.section}>
            <h3
              className={styles.sectionHeader}
              onClick={() => setShowAllocations(!showAllocations)}
            >
              {showAllocations ? <DownOutlined /> : <RightOutlined />}{' '}
              Allocations
            </h3>
            {showAllocations && <SUAllocationsCard />}
          </div>
        </div>

        {/* Vertical Divider */}
        <div className={styles.verticalSeparator}></div>

        {/* Right Panel */}
        <div className={styles.rightPanel}>
          <div className={styles.statusCard}>
            <h3 className={styles.statusTitle}>System Status</h3>
            <SystemStatus />
          </div>

          <div className={styles.statusCard}>
            <h3 className={styles.statusTitle}>Recently Accessed Tools</h3>
            <RecentlyAccessed />
          </div>

          <UserGuides />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default Dashboard;
