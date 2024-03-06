import {
  BaseProjectDetails,
  ProjectNavbar,
  ProjectPreview,
  ProjectTitleHeader,
} from '@client/datafiles';
import { useProjectDetail } from '@client/hooks';
import React from 'react';
import { useParams } from 'react-router-dom';

export const ProjectPreviewLayout: React.FC = () => {
  const { projectId } = useParams();
  const { data } = useProjectDetail(projectId ?? '');

  if (!projectId) return null;
  if (!data) return null;
  return (
    <div style={{ flex: 1 }}>
      <ProjectTitleHeader projectId={projectId} />
      <BaseProjectDetails projectValue={data.baseProject.value} />

      <ProjectNavbar projectId={projectId} />
      <ProjectPreview projectId={projectId} />
    </div>
  );
};
