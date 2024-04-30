import { FileListing, PublicationView } from '@client/datafiles';
import { usePublicationDetail } from '@client/hooks';
import React from 'react';
import { useParams } from 'react-router-dom';

export const PublishedEntityListingLayout: React.FC = () => {
  const { projectId } = useParams();
  const { data } = usePublicationDetail(projectId ?? '');

  if (!projectId || !data) return null;

  return (
    <div style={{ width: '100%' }}>
      <PublicationView projectId={projectId} />
      {['other', 'field_reconnaissance'].includes(
        data.baseProject.projectType
      ) && (
        <FileListing
          scroll={{ y: 500 }}
          api="tapis"
          system="designsafe.storage.published"
          path={data.baseProject.projectId}
          baseRoute="."
        />
      )}
    </div>
  );
};
