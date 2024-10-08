import { useMemo } from 'react';
import { useProjectDetail } from './useProjectDetail';
import { useMatches } from 'react-router-dom';

export function useCheckFilesForAssociation(
  projectId: string,
  filePaths: string[]
): boolean {
  /* Check if a selection contains files that are associated to an entity in a project.
  If so, we need to forbid rename/move operations. to prevent metadata from becoming 
  desynchronized. */

  // don't call the Projects api when viewing a publication.
  const matches = useMatches();
  const isProjects = matches.find((m) => m.id === 'project');

  const { data } = useProjectDetail(isProjects ? projectId : '');

  const hasAssociatedEnities = useMemo(() => {
    if (!data) return false;
    // Type Other can move associated files since associations are reset in the pipeline.
    if (data.baseProject.value.projectType === 'other') return false;
    const associatedFiles: string[] = [];
    data?.entities.forEach((entity) => {
      entity.value.fileObjs?.forEach((fo) => associatedFiles.push(fo.path));
      //entity.value.fileTags?.forEach((ft) => associatedFiles.push(ft.path));
    });
    let hasAssociations = false;
    filePaths.forEach((filePath) => {
      if (
        associatedFiles.includes(filePath) ||
        associatedFiles
          .filter((f) => !!f)
          .some(
            (associatedPath) => associatedPath.startsWith(`${filePath}/`) // Catch association of file within a folder.
          )
      ) {
        hasAssociations = true;
      }
    });

    return hasAssociations;
  }, [data, filePaths]);

  return hasAssociatedEnities;
}
