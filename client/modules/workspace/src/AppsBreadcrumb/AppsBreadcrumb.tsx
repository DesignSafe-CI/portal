import { Breadcrumb, BreadcrumbProps } from 'antd';
import React from 'react';
import styles from './AppsBreadcrumb.module.css';

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
  const breadcrumbItems = [...initialBreadcrumbs, ...getPathRoutes(path)];

  return (
    <Breadcrumb
      className={styles.appsBreadcrumb}
      items={breadcrumbItems}
      {...props}
    />
  );
};
