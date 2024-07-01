import { Breadcrumb, BreadcrumbProps } from 'antd';
import React from 'react';
import styles from './DatafilesBreadcrumb.module.css';
import { getSystemRootDisplayName, useAuthenticatedUser } from '@client/hooks';

function getPathRoutes(
  baseRoute: string,
  path: string = '',
  relativeTo: string = ''
) {
  const pathComponents = path
    .replace(relativeTo, '')
    .split('/')
    .filter((p) => !!p);
  return pathComponents.map((comp, i) => ({
    title: comp,
    path: `${baseRoute}/${encodeURIComponent(relativeTo)}${encodeURIComponent(
      '/' + pathComponents.slice(0, i + 1).join('/')
    )}`,
  }));
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
    ...getPathRoutes(baseRoute, path, systemRoot),
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
  {
    api: string;
    system: string;
    path: string;
    systemRootAlias?: string;
    initialBreadcrumbs?: { title: string; path: string }[];
    systemLabel?: string;
  } & BreadcrumbProps
> = ({
  api,
  system,
  path,
  systemRootAlias,
  initialBreadcrumbs = [],
  systemLabel,
  ...props
}) => {
  const { user } = useAuthenticatedUser();
  const rootAlias =
    systemRootAlias || getSystemRootDisplayName(api, system, systemLabel);
  const systemRoot = isUserHomeSystem(system) ? '/' + user?.username : '';
  return (
    <DatafilesBreadcrumb
      initialBreadcrumbs={[
        ...initialBreadcrumbs,
        {
          path: `/${api}/${system}/${encodeURIComponent(systemRoot)}`,
          title: rootAlias,
        },
      ]}
      path={path}
      baseRoute={`/${api}/${system}`}
      systemRoot={isUserHomeSystem(system) ? '/' + user?.username : ''}
      systemRootAlias={systemRootAlias || getSystemRootDisplayName(api, system)}
      {...props}
    />
  );
};
