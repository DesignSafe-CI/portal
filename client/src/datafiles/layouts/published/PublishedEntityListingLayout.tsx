import { FileListing, PublicationView } from '@client/datafiles';
import {
  DoiContextProvider,
  usePublicationDetail,
  usePublicationVersions,
} from '@client/hooks';
import React from 'react';
import { useParams } from 'react-router-dom';

export const PublishedEntityListingLayout: React.FC = () => {
  const { projectId } = useParams();
  const { data } = usePublicationDetail(projectId ?? '');
  const { selectedVersion } = usePublicationVersions(projectId ?? '');
  if (!projectId || !data) return null;

  return (
    <div>
      <PublicationView projectId={projectId} />
      {['other', 'field_reconnaissance'].includes(
        data.baseProject.projectType
      ) && (
        <DoiContextProvider value={data.baseProject.dois?.[0]}>
          {!data.baseProject.tombstone && (
            <FileListing
              scroll={{ y: 500, x: 500 }}
              api="tapis"
              system="designsafe.storage.published"
              path={encodeURIComponent(
                `${
                  data.tree.children.find((c) => c.version === selectedVersion)
                    ?.basePath ?? ''
                }/data`
              )}
              baseRoute="."
              fileTags={data.fileTags}
            />
          )}
        </DoiContextProvider>
      )}
    </div>
  );
};
