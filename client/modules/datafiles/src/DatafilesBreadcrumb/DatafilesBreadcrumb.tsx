import { Breadcrumb, BreadcrumbProps } from 'antd';
import React from 'react';
import styles from './DatafilesBreadcrumb.module.css';
import { getSystemRootDisplayName, useAuthenticatedUser } from '@client/hooks';

function getPathRoutes(
  baseRoute: string,
  path: string = '',
  systemRoot: string = '',
  systemRootAlias?: string
) {
  const pathComponents = decodeURIComponent(path.replace(systemRoot, ''))
    .split('/')
    .filter((p) => !!p);

  const systemRootBreadcrumb = {
    path: `${baseRoute}/${systemRoot}`,
    title: systemRootAlias ?? 'Data Files',
  };

  return [
    systemRootBreadcrumb,
    ...pathComponents.map((comp, i) => ({
      title: comp,
      path: `${baseRoute}/${systemRoot}${encodeURIComponent(
        '/' + pathComponents.slice(0, i + 1).join('/')
      )}`,
    })),
  ];
}

export const DatafilesBreadcrumb: React.FC<
  {
    initialBreadcrumbs: { title: string; path: string }[];
    path: string;
    baseRoute: string;
    systemRoot: string;
    systemRootAlias?: string;
  } & BreadcrumbProps
> = ({
  initialBreadcrumbs,
  path,
  baseRoute,
  systemRoot,
  systemRootAlias,
  ...props
}) => {
  const breadcrumbItems = [
    ...initialBreadcrumbs,
    ...getPathRoutes(baseRoute, path, systemRoot, systemRootAlias),
  ];

  return (
    <Breadcrumb
      className={styles.datafilesBreadcrumb}
      items={breadcrumbItems}
      {...props}
    />
  );
};

function isUserHomeSystem(system: string) {
  return [
    'designsafe.storage.default',
    'designsafe.storage.frontera.work',
  ].includes(system);
}

export const BaseFileListingBreadcrumb: React.FC<
  { api: string; system: string; path: string } & BreadcrumbProps
> = ({ api, system, path, ...props }) => {
  const { user } = useAuthenticatedUser();

  return (
    <DatafilesBreadcrumb
      initialBreadcrumbs={[]}
      path={path}
      baseRoute={`/${api}/${system}`}
      systemRoot={
        isUserHomeSystem(system) ? encodeURIComponent('/' + user?.username) : ''
      }
      systemRootAlias={getSystemRootDisplayName(api, system)}
      {...props}
    />
  );
};
