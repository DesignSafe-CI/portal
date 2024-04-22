import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TFileListing } from './useFileListing';

export function useSelectedFiles(
  api: string,
  system: string,
  basePath: string
) {
  const queryKey = useMemo(
    () => ['selected-rows', api, system, basePath],
    [api, system, basePath]
  );
  const selectedRowsQuery = useQuery<TFileListing[]>({
    queryKey,
    initialData: [],
    enabled: false,
  });

  const queryClient = useQueryClient();
  const setSelectedFiles = useCallback(
    (selection: TFileListing[]) => {
      queryClient.setQueryData(queryKey, selection);
      queryClient.invalidateQueries({ queryKey: ['rows-for-system'] });
    },
    [queryKey, queryClient]
  );

  const unsetSelections = useCallback(() => {
    queryClient.setQueriesData({ queryKey: ['selected-rows'] }, () => []);
    queryClient.invalidateQueries({ queryKey: ['rows-for-system'] });
  }, [queryClient]);

  return {
    selectedFiles: selectedRowsQuery.data,
    setSelectedFiles,
    unsetSelections,
  };
}

export function useSelectedFilesForSystem(api: string, system: string) {
  // Get all selected files matching a given system.
  // Used when multiple listings can be present in a single page, e.g. publications.

  const queryClient = useQueryClient();
  /*
  const selections = useMemo(() => {
    const queryKey = ['selected-rows', api, system];
    return queryClient.getQueriesData<TFileListing[]>({ queryKey });
  }, [api, system, queryClient]);
  */

  const { data: selections } = useQuery({
    queryKey: ['rows-for-system', api, system],
    queryFn: () => {
      const queryKey = ['selected-rows', api, system];
      return queryClient.getQueriesData<TFileListing[]>({ queryKey });
    },
  });

  const reducedSelections = useMemo(() => {
    const allSelections: TFileListing[] = [];
    (selections ?? []).forEach((s) => s[1] && allSelections.push(...s[1]));
    return allSelections;
  }, [selections]);
  return reducedSelections;
}
