import React, { useEffect, useState } from 'react';
import { Breadcrumb } from 'antd';
import { Link, useParams, useLocation } from 'react-router-dom';
import styles from './AppsBreadcrumb.module.css';
import { TAppParamsType, TAppResponse, useGetApps } from '@client/hooks';

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
  const [appData, setAppData] = useState<TAppResponse | null>(null);
  const { appId } = useParams() as TAppParamsType;
  const appVersion = new URLSearchParams(useLocation().search).get(
    'appVersion'
  ) as string | undefined;

  const { data, isLoading } = useGetApps({ appId, appVersion });

  useEffect(() => {
    if (data) {
      setAppData(data);
    }
  }, [data]);

  const { pathname } = useLocation();
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
            let title = obj.title;
            const isLast = obj?.path === items[items.length - 1]?.path;
            console.log(isLast, items)
            if (appData && obj.title !== 'Home' && obj.title !== 'Tools & Applications' && obj.title !== 'Job Status') {
              title = appData.definition.notes?.label || appData.definition.id || obj.title;
            }
            return (
              <>
                {obj.path && !isLast ? (
                  <Link className="breadcrumb-link" to={obj.path}>
                    {title}
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