//import styles from './Dashboard.module.css';
import QuickLinksNavbar from './QuickLinksNavbar'; 
import RecentlyAccessed from './RecentlyAccessed';
import RecentProjects from './RecentProjects';
import { TicketList } from './TicketList';

/* eslint-disable-next-line */
export interface DashboardProps {}

export function Dashboard(props: DashboardProps) {
  return (
    <div>
      <QuickLinksNavbar />
      <div style={{ marginLeft: '200px', padding: '10px' }}>
        <TicketList />
        <RecentlyAccessed />
        <RecentProjects />
      </div>
    </div>
  );
}

export default Dashboard;
