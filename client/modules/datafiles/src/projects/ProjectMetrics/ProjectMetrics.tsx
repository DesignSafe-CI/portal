import { useProjectDetail, usePublicationDetail } from '@client/hooks';

export const ProjectMetrics: React.FC<{
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
          .join(', ')}{' '}
        ({new Date(entityDetails.publicationDate).getFullYear()}). "
        {entityDetails.value.title}", in <i>{data.baseProject.title}</i>.
        DesignSafe-CI. ({entityDetails.value.dois && entityDetails.value.dois[0]})
      </div>
    );
  };