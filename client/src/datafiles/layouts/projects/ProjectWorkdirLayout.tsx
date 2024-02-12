import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { DatafilesBreadcrumb, FileListing } from '@client/datafiles';
import { useProjectDetail } from '@client/hooks';

export const ProjectWorkdirLayout: React.FC = () => {
  const { projectId, path } = useParams();
  const { data } = useProjectDetail(projectId ?? '');
  if (!data) return <div>loading...</div>;
  return (
    <>
      <DatafilesBreadcrumb
        initialBreadcrumbs={[]}
        path={path ?? ''}
        baseRoute={`/projects/${projectId}/workdir`}
        systemRootAlias={projectId}
        systemRoot=""
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
        {data && (
          <FileListing
            api="tapis"
            system={`project-${data.baseProject.uuid}`}
            path={path ?? ''}
            scroll={{ y: 500 }}
          />
        )}
      </div>
    </>
  );
};
