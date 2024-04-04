import { Breadcrumb, BreadcrumbProps } from 'antd';
import React, { useEffect, useState } from 'react';
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

export const AppsBreadcrumb: React.FC<
  {
    initialBreadcrumbs: { title: string; path: string }[];
    path: string;
  } & BreadcrumbProps
> = ({ initialBreadcrumbs, path, ...props }) => {
  const [appData, setAppData] = useState<TAppResponse | null>(null);
  const { appId } = useParams() as TAppParamsType;
  const appVersion = new URLSearchParams(useLocation().search).get(
    'appVersion'
  ) as string | undefined;

  const { data, isLoading } = useGetApps({ appId, appVersion });
  console.log(data);
  useEffect(() => {
    if (data) {
      setAppData(data);
    }
  }, [data]);

  const breadcrumbItems = [...initialBreadcrumbs, ...getPathRoutes(path)];

  return (
    <div className={styles.breadcrumbWrapper}>
      {isLoading && <div>Loading...</div>}
      {!isLoading && appData && (
        <Breadcrumb
          className={styles.appsBreadcrumb}
          items={breadcrumbItems}
          itemRender={(obj) => {
            if (!obj.path) {
              return <span className="breadcrumb-text">{obj.title}</span>;
            }
            const title = obj.title as string;
            return (
              <Link className="breadcrumb-link" to={obj.path}>
                {data &&
                data.definition &&
                data.definition.notes &&
                data.definition.notes.label
                  ? data.definition.notes.label
                  : title}
              </Link>
            );
          }}
          {...props}
        />
      )}
    </div>
  );
};
