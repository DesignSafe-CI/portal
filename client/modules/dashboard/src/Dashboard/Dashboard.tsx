import React from 'react';
import { QuickLinks } from '../QuickLinks/QuickLinks';
import {
  useGetUserUsage,
  useGetUserTickets,
  useGetNotifications,
  TGetNotificationsResponse,
} from '@client/hooks';
import { UsageGraphic } from '../UsageGraphic/UsageGraphic';
import { UserTickets } from '../UserTickets/UserTickets';
import { UserNotifications } from '../UserNotifications/UserNotifications';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const { data: userUsage } = useGetUserUsage();
  const { data: userTickets } = useGetUserTickets();
  const { data: userNotifications } = useGetNotifications({ limit: 5 });

  return (
    <div id={styles.dashboard} className="container">
      <div className={`row ${styles['dashboard-top']}`}>
        <UsageGraphic userUsage={userUsage} />
        <QuickLinks />
      </div>
      <div className={`row ${styles['dashboard-bottom']}`}>
        <UserTickets userTickets={userTickets} />
        <UserNotifications userNotifications={userNotifications} />
      </div>
    </div>
  );
}

export default Dashboard;
