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

  const selectedBasePath =
    data.tree.children.find((child) => (child.version ?? 1) === selectedVersion)
      ?.basePath ?? '';

  return (
    <div>
      <PublicationView projectId={projectId} />
      {['other', 'software', 'field_reconnaissance'].includes(
        data.baseProject.projectType
      ) && (
        <DoiContextProvider value={data.baseProject.dois?.[0]}>
          {!data.baseProject.tombstone && (
            <FileListing
              scroll={{ y: 500, x: 500 }}
              api="tapis"
              system="designsafe.storage.published"
              scheme="public"
              path={encodeURIComponent(`${selectedBasePath}/data`)}
              downloadArchives={data.baseProject.projectType === 'software'}
              emptyListingDisplay={
                data.baseProject.projectType === 'software'
                  ? 'File Unavailable'
                  : undefined
              }
              baseRoute="."
              fileTags={data.fileTags}
            />
          )}
        </DoiContextProvider>
      )}
    </div>
  );
};
