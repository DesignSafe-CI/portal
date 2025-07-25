import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Collapse, Typography } from 'antd';
import Quicklinks from './QuickLinksNavbar';
import RecentlyAccessed from './RecentlyAccessed';
import RecentProjects from './RecentProjects';
import { TicketList } from './TicketList';
import styles from './Dashboard.module.css';

const { Text } = Typography;
const { Panel } = Collapse;
const queryClient = new QueryClient();

export function Dashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className={styles.dashboardContainer}>
        <div className={styles.sidebar}>
          <Quicklinks />
        </div>
        <div className={styles.sidebarMargin}>
          <Collapse ghost expandIconPosition="end">
            <Panel header={<Text strong>Recent Projects</Text>} key="1">
              <RecentProjects />
            </Panel>
            <Panel header={<Text strong>Recently Accessed Tools</Text>} key="2">
              <RecentlyAccessed />
            </Panel>
            <Panel header={<Text strong>My Tickets</Text>} key="3">
              <TicketList />
            </Panel>
          </Collapse>
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default Dashboard;
