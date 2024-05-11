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
    ...pathComponents.slice(systemRoot ? 1 : 0).map((comp, i) => ({
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
    skipBreadcrumbs?: number; // Number of path elements to skip when generating breadcrumbs
  } & BreadcrumbProps
> = ({
  initialBreadcrumbs,
  path,
  baseRoute,
  systemRoot,
  systemRootAlias,
  skipBreadcrumbs,
  ...props
}) => {
  const breadcrumbItems = [
    ...initialBreadcrumbs,
    ...getPathRoutes(baseRoute, path, systemRoot, systemRootAlias).slice(
      skipBreadcrumbs ?? 0
    ),
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
  } & BreadcrumbProps
> = ({
  api,
  system,
  path,
  systemRootAlias,
  initialBreadcrumbs = [],
  ...props
}) => {
  const { user } = useAuthenticatedUser();

  return (
    <DatafilesBreadcrumb
      initialBreadcrumbs={initialBreadcrumbs ?? []}
      path={path}
      baseRoute={`/${api}/${system}`}
      systemRoot={
        isUserHomeSystem(system) ? encodeURIComponent('/' + user?.username) : ''
      }
      systemRootAlias={systemRootAlias || getSystemRootDisplayName(api, system)}
      {...props}
    />
  );
};
