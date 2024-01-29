import { Breadcrumb } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './DatafilesBreadcrumb.module.css';

function getPathRoutes(
  base: string,
  path?: string,
  excludeFirstNItems?: number
) {
  if (!path) return [];
  const pathComponents = path.split('/').filter((p) => !!p);
  return pathComponents
    .map((comp, i) => ({
      title: comp,
      path: `${base}/${encodeURIComponent(
        '/' + pathComponents.slice(0, i + 1).join('/')
      )}`,
    }))
    .slice(excludeFirstNItems);
}

export const DatafilesBreadcrumb: React.FC<{
  initialBreadcrumbs: { title: string; path: string }[];
  path: string;
  excludeBasePath: boolean;
}> = ({ initialBreadcrumbs, path, excludeBasePath }) => {
  const basePath = initialBreadcrumbs.slice(-1)[0].path ?? '/';
  const breadcrumbItems = [
    ...initialBreadcrumbs,
    ...getPathRoutes(basePath, path, excludeBasePath ? 1 : 0),
  ];
  return (
    <Breadcrumb
      className={styles.datafilesBreadcrumb}
      items={breadcrumbItems}
      itemRender={(obj, _, items) => {
        //const last = items.indexOf(obj) === items.length - 1;
        return (
          <Link className={styles.breadcrumbLink} to={obj.path ?? '/'}>
            {obj.title}
          </Link>
        );
      }}
    />
  );
};
