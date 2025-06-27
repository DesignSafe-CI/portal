import React from 'react';
import Quicklinks from './QuickLinksNavbar';
import RecentlyAccessed from './RecentlyAccessed';
import RecentProjects from './RecentProjects';
import { TicketList } from './TicketList';
import FavoriteTools from './FavoriteTools';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/* eslint-disable-next-line */
export interface DashboardProps { }

const queryClient = new QueryClient();

export function Dashboard(props: DashboardProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <Quicklinks />
        <div style={{ marginLeft: '200px', padding: '10px' }}>
          <TicketList />
          <RecentlyAccessed />
          <FavoriteTools />
          <RecentProjects />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default Dashboard;
