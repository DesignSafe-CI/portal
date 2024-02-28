import { BaseProjectDetails, PublicationView } from '@client/datafiles';
import { usePublicationDetail } from '@client/hooks';
import React from 'react';
import { Outlet, useParams } from 'react-router-dom';

export const PublishedDetailLayout: React.FC = () => {
  const { projectId } = useParams();
  const { data } = usePublicationDetail(projectId ?? '');
  if (!projectId || !data) return null;
  return (
    <div style={{ width: '100%' }}>
      Placeholder for the Publication detail layout.
      <BaseProjectDetails projectValue={data?.baseProject} />
      <PublicationView projectId={projectId} />
      <Outlet />
    </div>
  );
};
