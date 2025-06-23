//import styles from './Dashboard.module.css';
import Quicklinks from './QuickLinksNavbar';
import RecentlyAccessed from './RecentlyAccessed';
import RecentProjects from './RecentProjects';
import { TicketList } from './TicketList';
import FavoriteTools from './FavoriteTools';

/* eslint-disable-next-line */
export interface DashboardProps {}

export function Dashboard(props: DashboardProps) {
  return (
    <div>
      <Quicklinks />
      <div style={{ marginLeft: '200px', padding: '10px' }}>
        <TicketList />
        <RecentlyAccessed />
        <FavoriteTools />
        <RecentProjects />
      </div>
    </div>
  );
}

export default Dashboard;
