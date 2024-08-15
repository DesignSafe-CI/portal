import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { DatafilesBreadcrumb, FileListing } from '@client/datafiles';

export const PublishedFileListingLayout: React.FC = () => {
  const { projectId, path } = useParams();
  if (!projectId) return null;
  return (
    <>
      <DatafilesBreadcrumb
        initialBreadcrumbs={[
          {
            title: projectId,
            path: `/public/designsafe.storage.published/${projectId}`,
          },
        ]}
        path={path ?? ''}
        baseRoute={`/public/designsafe.storage.published/${projectId}`}
        systemRootAlias={projectId}
        systemRoot={projectId}
        skipBreadcrumbs={1}
        itemRender={(obj) => {
          return (
            <Link className="breadcrumb-link" to={obj.path ?? '/'}>
              {obj.title}
            </Link>
          );
        }}
      />
      <div style={{ paddingBottom: '32px' }}>
        {' '}
        <FileListing
          api="tapis"
          system="designsafe.storage.published"
          path={path ?? ''}
          scroll={{ y: 500 }}
        />
      </div>
    </>
  );
};
