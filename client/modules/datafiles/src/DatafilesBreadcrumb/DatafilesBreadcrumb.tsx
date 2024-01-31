import { Breadcrumb, BreadcrumbProps } from 'antd';
import React from 'react';
import styles from './DatafilesBreadcrumb.module.css';

function getPathRoutes(base: string, path?: string) {
  if (!path) return [];
  const pathComponents = decodeURIComponent(path)
    .split('/')
    .filter((p) => !!p);

  return pathComponents.map((comp, i) => ({
    title: comp,
    path: `${base}/${encodeURIComponent(
      '/' + pathComponents.slice(0, i + 1).join('/')
    )}`,
  }));
}

export const DatafilesBreadcrumb: React.FC<
  {
    initialBreadcrumbs: { title: string; path: string }[];
    path: string;
    excludeBasePath: boolean;
  } & BreadcrumbProps
> = ({ initialBreadcrumbs, path, excludeBasePath, ...props }) => {
  const basePath = initialBreadcrumbs.slice(-1)[0].path ?? '/';

  let breadcrumbItems = [
    ...initialBreadcrumbs,
    ...getPathRoutes(basePath, path),
  ];

  if (excludeBasePath && breadcrumbItems.length > 1) {
    breadcrumbItems[1].title = initialBreadcrumbs.slice(-1)[0].title;
    breadcrumbItems = breadcrumbItems.slice(1);
  }

  return (
    <Breadcrumb
      className={styles.datafilesBreadcrumb}
      items={breadcrumbItems}
      {...props}
    />
  );
};
