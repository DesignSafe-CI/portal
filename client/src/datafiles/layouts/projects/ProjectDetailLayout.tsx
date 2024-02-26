import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { BaseProjectDetails, ProjectTitleHeader } from '@client/datafiles';
import { useProjectDetail } from '@client/hooks';

export const ProjectDetailLayout: React.FC = () => {
  const { projectId } = useParams();
  const { data } = useProjectDetail(projectId ?? '');
  if (!data || !projectId) return <div>loading...</div>;

  return (
    <section>
      <ProjectTitleHeader projectId={projectId} />
      <BaseProjectDetails projectValue={data.baseProject.value} />
      <Outlet />
    </section>
  );
};
