import React, { ReactNode } from 'react';
import { Breadcrumb, Button } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import styles from './AppsBreadcrumb.module.css';
import './AppsBreadcrumb.global.css';
import { useGetApps, TAppResponse } from '@client/hooks';
import { useGetAppParams } from '../utils';

function getPathRoutes(path: string = '') {
  const pathComponents = decodeURIComponent(path)
    .split('/')
    .filter((p) => !!p);

  return pathComponents.map((comp, i) => ({
    title: comp === 'history' ? 'Job Status' : comp, // Modify the path for Job Status
    path: '/' + encodeURIComponent(pathComponents.slice(0, i + 1).join('/')),
  }));
}

export const AppsBreadcrumb: React.FC = () => {
  const { pathname } = useLocation();
  const { appId, appVersion } = useGetAppParams();

  const breadcrumbItems = [
    { title: 'Home', path: window.location.origin },
    { title: 'Use DesignSafe' },
    {
      title: 'Tools & Applications',
      href: '/use-designsafe/tools-applications/',
    },
  ];

  return (
    <Breadcrumb
      className={styles.root}
      separator=">"
      items={[...breadcrumbItems, ...getPathRoutes(pathname)]}
      itemRender={(obj, _params, items) => {
        const isLast = obj?.path === items[items.length - 1]?.path;

        return appId && isLast ? (
          <AppBreadcrumb appId={appId} appVersion={appVersion} />
        ) : (
          <BreadcrumbRender
            path={obj.path}
            href={obj.href}
            title={obj.title}
            isLast={isLast}
          />
        );
      }}
    />
  );
};

export const BreadcrumbRender: React.FC<{
  path?: string;
  href?: string;
  title: ReactNode;
  isLast: boolean;
}> = ({ path, href, title, isLast }) => {
  if (href && !isLast)
    return (
      <Button className="breadcrumb-link" href={href} type="link">
        {title}
      </Button>
    );

  if (isLast || !path) {
    return <span>{title}</span>;
  }

  return (
    <Link className="breadcrumb-link" to={path}>
      {title}
    </Link>
  );
};

export const AppBreadcrumb: React.FC<{
  appId: string;
  appVersion?: string;
}> = ({ appId, appVersion }) => {
  const { data: appData } = useGetApps({ appId, appVersion }) as {
    data: TAppResponse;
  };
  const title = appData?.definition.notes?.label || appData?.definition.id;

  return <BreadcrumbRender title={title} isLast />;
};

export default AppsBreadcrumb;
