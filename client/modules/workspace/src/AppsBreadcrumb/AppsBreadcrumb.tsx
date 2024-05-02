import React from 'react';
import { Breadcrumb } from 'antd';
import { Link, useLocation, useParams } from 'react-router-dom';
import styles from './AppsBreadcrumb.module.css';
import { useGetApps, TAppResponse } from '@client/hooks';
import { getAppParams } from '@client/workspace';

function getPathRoutes(path: string = '') {
  const pathComponents = decodeURIComponent(path)
    .split('/')
    .filter((p) => !!p);

  return pathComponents.map((comp, i) => ({
    title: comp,
    path: '/' + encodeURIComponent(pathComponents.slice(0, i + 1).join('/')),
  }));
}

export const AppsBreadcrumb: React.FC = () => {
  const { pathname } = useLocation();
  const { appId, appVersion } = getAppParams();

  let appData = {} as TAppResponse;
  if (appId) {
    const { data } = useGetApps({ appId, appVersion }) as {
      data: TAppResponse;
    };
    appData = data;
  }

  const breadcrumbItems = [
    { title: 'Home', path: window.location.origin },
    { title: 'Use DesignSafe' },
    { title: 'Tools & Applications', path: '/' },
  ];

  // Modify the path for Job Status
  let modifiedPath = pathname;
  if (pathname.endsWith('/history')) {
    modifiedPath = 'Job Status';
  }

  return (
    <div className={styles.breadcrumbWrapper}>
      <Breadcrumb
        className={styles.appsBreadcrumb}
        separator=">"
        items={[...breadcrumbItems, ...getPathRoutes(modifiedPath)]}
        itemRender={(obj, _params, items) => {
          if (!obj.path) {
            return <span className="breadcrumb-text">{obj.title}</span>;
          }
          const title = appId
            ? appData?.definition.notes?.label || appData?.definition.id
            : obj.title;
          const isLast = obj?.path === items[items.length - 1]?.path;

          return (
            <>
              {obj.path && !isLast ? (
                <Link className="breadcrumb-link" to={obj.path}>
                  {obj.title}
                </Link>
              ) : (
                <span className="breadcrumb-text">{title}</span>
              )}
            </>
          );
        }}
      />
    </div>
  );
};

export default AppsBreadcrumb;
