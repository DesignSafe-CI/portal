import { Breadcrumb, BreadcrumbProps } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './AppsBreadcrumb.module.css';
import appsListingJson from '../../../_test-fixtures/src/fixtures/workspace/apps-tray-listing.json';

function getPathRoutes(path: string = '') {
  const pathComponents = decodeURIComponent(path)
    .split('/')
    .filter((p) => !!p);

  return pathComponents.map((comp, i) => ({
    title: comp,
    path: '/' + encodeURIComponent(pathComponents.slice(0, i + 1).join('/')),
  }));
}

function get_bundle_label_from_title(title: string): string {
  const categories = appsListingJson.categories;
  for (const category of categories) {
    for (const app of category.apps) {
      if (app.app_id === title) {
        return app.bundle_label;
      }
    }
  }
  return title;
}

export const AppsBreadcrumb: React.FC<
  {
    initialBreadcrumbs: { title: string; path: string }[];
    path: string;
  } & BreadcrumbProps
> = ({ initialBreadcrumbs, path, ...props }) => {
  const breadcrumbItems = [...initialBreadcrumbs, ...getPathRoutes(path)];

  return (
    <div className={styles.breadcrumbWrapper}>
      <Breadcrumb
        className={styles.appsBreadcrumb}
        items={breadcrumbItems}
        itemRender={(obj) => {
          if (!obj.path) {
            return <span className="breadcrumb-text">{obj.title}</span>;
          }
          const title = obj.title as string;
          const bundle_label = get_bundle_label_from_title(title);
          return (
            <Link className="breadcrumb-link" to={obj.path}>
              {bundle_label}
            </Link>
          );
        }}
        {...props}
      />
    </div>
  );
};
