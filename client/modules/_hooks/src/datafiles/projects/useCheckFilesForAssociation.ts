import { useMemo } from 'react';
import { useProjectDetail } from './useProjectDetail';

export function useCheckFilesForAssociation(
  projectId: string,
  filePaths: string[]
): boolean {
  /* Check if a selection contains files that are associated to an entity in a project.
  If so, we need to forbid rename/move operations. to prevent metadata from becoming 
  desynchronized. */

  const { data } = useProjectDetail(projectId);

  const hasAssociatedEnities = useMemo(() => {
    if (!data) return false;
    const associatedFiles: string[] = [];
    data?.entities.forEach((entity) => {
      entity.value.fileObjs?.forEach((fo) => associatedFiles.push(fo.path));
      //entity.value.fileTags?.forEach((ft) => associatedFiles.push(ft.path));
    });
    let hasAssociations = false;
    console.log(associatedFiles);
    console.log(filePaths);
    filePaths.forEach((filePath) => {
      console.log(associatedFiles);
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
