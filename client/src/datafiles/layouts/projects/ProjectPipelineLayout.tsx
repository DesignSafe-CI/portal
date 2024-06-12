import React from 'react';
import { useParams } from 'react-router-dom';
import { ProjectPipeline } from '@client/datafiles';

export const ProjectPipelineLayout: React.FC = () => {
  const { projectId } = useParams();
  if (!projectId) return null;
  return (
    <div style={{ width: '100%', marginBottom: '24px' }}>
      <ProjectPipeline projectId={projectId} />
    </div>
  );
};
