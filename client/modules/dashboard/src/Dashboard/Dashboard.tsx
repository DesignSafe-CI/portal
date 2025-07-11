import { useState } from 'react';
import Quicklinks from './QuickLinksNavbar';
import RecentlyAccessed from './RecentlyAccessed';
import RecentProjects from './RecentProjects';
import { TicketList } from './TicketList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import styles from './Dashboard.module.css';

export interface DashboardProps {}

const queryClient = new QueryClient();

export function Dashboard(props: DashboardProps) {
  const [expandedSections, setExpandedSections] = useState({
    recentProjects: false,
    recentlyAccessed: false,
    ticketList: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ display: 'flex' }}>
        <Quicklinks />
        <div style={{ marginLeft: '200px', padding: '10px', width: '100%' }}>
          <div className={styles.collapsibleSection}>
            <h3
              className={styles.collapsibleHeader}
              onClick={() => toggleSection('recentProjects')}
            >
              Recent Projects{' '}
              <span className={styles.arrow}>
                {expandedSections.recentProjects ? '▼' : '▶'}
              </span>
            </h3>
            {expandedSections.recentProjects && <RecentProjects />}
          </div>

          <div className={styles.collapsibleSection}>
            <h3
              className={styles.collapsibleHeader}
              onClick={() => toggleSection('recentlyAccessed')}
            >
              Recently Accessed Tools{' '}
              <span className={styles.arrow}>
                {expandedSections.recentlyAccessed ? '▼' : '▶'}
              </span>
            </h3>
            {expandedSections.recentlyAccessed && <RecentlyAccessed />}
          </div>

          <div className={styles.collapsibleSection}>
            <h3
              className={styles.collapsibleHeader}
              onClick={() => toggleSection('ticketList')}
            >
              My Tickets{' '}
              <span className={styles.arrow}>
                {expandedSections.ticketList ? '▼' : '▶'}
              </span>
            </h3>
            {expandedSections.ticketList && <TicketList />}
          </div>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default Dashboard;
