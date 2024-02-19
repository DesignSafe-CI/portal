import { ProjectCurationFileListing, ProjectTree } from '@client/datafiles';

import React from 'react';
import { useParams } from 'react-router-dom';

export const ProjectCurationLayout: React.FC = () => {
  const { projectId, path } = useParams();
  if (!projectId) return null;
  return (
    <div style={{ paddingBottom: '50px' }}>
      Placeholder for the project curation view (listing and toolbar for
      handling associations)
      <ProjectCurationFileListing projectId={projectId} path={path ?? ''} />
      <ProjectTree projectId={projectId} />
    </div>
  );
};
