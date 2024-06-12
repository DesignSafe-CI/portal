import { useQuery } from '@tanstack/react-query';
import apiClient from '../../apiClient';
import { TBaseProject, TEntityMeta, TFileTag, TTreeData } from './types';
import { useMemo } from 'react';

type TProjectDetailResponse = {
  baseProject: TBaseProject;
  entities: TEntityMeta[];
  tree: TTreeData;
};

async function getProjectDetail({
  projectId,
  signal,
}: {
  projectId: string;
  signal: AbortSignal;
}) {
  const resp = await apiClient.get<TProjectDetailResponse>(
    `/api/projects/v2/${projectId}/`,
    {
      signal,
    }
  );
  return resp.data;
}

export function useProjectDetail(projectId: string) {
  return useQuery({
    queryKey: ['datafiles', 'projects', 'detail', projectId],
    queryFn: ({ signal }) => getProjectDetail({ projectId, signal }),
    enabled: !!projectId,
  });
}

export function useFileAssociations(projectId: string) {
  /*Return a record mapping file paths to an array of entities containing those paths.*/
  const { data } = useProjectDetail(projectId);

  const memoizedFileMapping = useMemo(() => {
    const entities = data?.entities ?? [];
    const fileMapping: Record<string, TEntityMeta[]> = {};
    entities.forEach((entity) => {
      const fileObjs = entity.value.fileObjs ?? [];
      fileObjs.forEach((fileObj) => {
        const entityList = fileMapping[fileObj.path] ?? [];
        entityList.push(entity);
        fileMapping[fileObj.path] = entityList;
      });
    });
    return fileMapping;
  }, [data]);

  return memoizedFileMapping;
}

export function useFileTags(projectId: string) {
  /*Return a record mapping file paths to an array of entities containing those paths.*/
  const { data } = useProjectDetail(projectId);

  const memoizedFileMapping = useMemo(() => {
    const entities = data?.entities ?? [];
    const tagMapping: Record<string, TFileTag[]> = {};
    entities.forEach((entity) => {
      const fileTags = entity.value.fileTags ?? [];
      tagMapping[entity.uuid] = fileTags;
    });

    return tagMapping;
  }, [data]);

  return memoizedFileMapping;
}
