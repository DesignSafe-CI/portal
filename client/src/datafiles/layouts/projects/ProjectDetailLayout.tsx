import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { BaseProjectDetails } from '@client/datafiles';
import { useProjectDetail } from '@client/hooks';

export const ProjectDetailLayout: React.FC = () => {
  const { projectId } = useParams();
  const { data } = useProjectDetail(projectId ?? '');
  if (!data) return <div>loading...</div>;

  return (
    <div style={{ width: '100%' }}>
      Placeholder for the project detail layout (handles workdir and curation).{' '}
      <BaseProjectDetails projectValue={data.baseProject.value} />
      <Outlet />
    </div>
  );
};
