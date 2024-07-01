import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileListing } from '@client/datafiles';
import { DatafilesBreadcrumb } from '@client/common-components';
import { usePublicationDetail } from '@client/hooks';

export const PublishedFileListingLayout: React.FC = () => {
  const { projectId, path } = useParams();
  const { data } = usePublicationDetail(projectId ?? '');
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
        systemRoot={`/${projectId}`}
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
          fileTags={data?.fileTags}
          scroll={{ y: 500 }}
        />
      </div>
    </>
  );
};
