import { BaseProjectDetails } from '@client/datafiles';
import { usePublicationDetail } from '@client/hooks';
import React, { useEffect } from 'react';
import { Outlet, useParams, useSearchParams } from 'react-router-dom';

export const PublishedDetailLayout: React.FC = () => {
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data } = usePublicationDetail(projectId ?? '');

  const version = (projectId ?? '').split('v')[1];
  useEffect(() => {
    if (version) {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('version', version);
      setSearchParams(newSearchParams);
    }
  }, [version, searchParams, setSearchParams]);

  if (!projectId || !data) return null;

  return (
    <div style={{ width: '100%', paddingBottom: '100px' }}>
      <div className="prj-head-title" style={{ marginBottom: '20px' }}>
        <strong>{data.baseProject.projectId}</strong>&nbsp;|&nbsp;
        {data.baseProject.title}
      </div>
      <BaseProjectDetails projectValue={data?.baseProject} />
      <Outlet />
    </div>
  );
};
