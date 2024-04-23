import { useProjectDetail, usePublicationDetail } from '@client/hooks';

export const ProjectCitation: React.FC<{
  projectId: string;
  entityUuid: string;
}> = ({ projectId, entityUuid }) => {
  const { data } = useProjectDetail(projectId);
  const entityDetails = data?.entities.find((e) => e.uuid === entityUuid);

  if (!data || !entityDetails) return null;
  return (
    <div>
      {(entityDetails.value.authors ?? [])
        .map((author, idx) =>
          idx === 0
            ? `${author.lname}, ${author.fname[0]}.`
            : `${author.fname[0]}. ${author.lname}`
        )
        .join(', ')}
      . "{entityDetails.value.title}", in <i>{data.baseProject.value.title}</i>.
      DesignSafe-CI. (DOI will appear after publication)
    </div>
  );
};

export const PublishedCitation: React.FC<{
  projectId: string;
  entityUuid: string;
  version?: number;
}> = ({ projectId, entityUuid, version = 1 }) => {
  const { data } = usePublicationDetail(projectId);

  const entityDetails = (data?.tree.children ?? []).find(
    (child) => child.uuid === entityUuid && child.version === version
  );
  if (!data || !entityDetails) return null;

  return (
    <div>
      {(entityDetails.value.authors ?? [])
        .map((author, idx) =>
          idx === 0
            ? `${author.lname}, ${author.fname[0]}.`
            : `${author.fname[0]}. ${author.lname}`
        )
        .join(', ')}
      . "{entityDetails.value.title}", in <i>{data.baseProject.title}</i>.
      DesignSafe-CI. (DOI will appear after publication)
    </div>
  );
};
