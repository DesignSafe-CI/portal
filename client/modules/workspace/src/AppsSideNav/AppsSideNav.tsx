import React, { useState } from 'react';
import { Collapse } from 'antd';
import { NavLink, useRouteLoaderData } from 'react-router-dom';
import styles from './AppsSideNav.module.css';
import { useAuthenticatedUser } from '@client/hooks';
import { AppCategories } from '@client/hooks';

const AppsNavLink: React.FC<React.PropsWithChildren<{ to: string }>> = ({
  to,
  children,
}) => {
  return (
    <li>
      <NavLink to={to} className={styles.navLink}>
        {children}
      </NavLink>
    </li>
  );
};
const { Panel } = Collapse;

export const AppsSideNav: React.FC = () => {
  const { user } = useAuthenticatedUser();
  const data = useRouteLoaderData('root') as AppCategories;
  const [activeApp, setActiveApp] = useState<string | string[]>([]);

  const toggle = (tab: string) => {
    const newActiveKey = Array.isArray(tab) ? tab[0] : tab;
    setActiveApp(prevActivePanel =>
      prevActivePanel === newActiveKey
        ? []
        : [newActiveKey]
    );
  };

  return (
    <Collapse
      accordion
      activeKey={activeApp}
      onChange={(key) => toggle(key)}
    >
      {user && data && data.categories.map((category) => (
        <Panel header={category.title} key={category.title}>
          <ul>
            {category.apps.map((app) => (
              <AppsNavLink
                key={`${app.app_id}-${app.version}`}
                to={
                  `applications/${app.app_id}` +
                  (app.version ? `?appVersion=${app.version}` : '')
                }
              >
                {app.label}
              </AppsNavLink>
            ))}
          </ul>
        </Panel>
      ))}
    </Collapse>
  );
};
