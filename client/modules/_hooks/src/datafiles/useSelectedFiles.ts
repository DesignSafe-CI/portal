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
    (selection: TFileListing[]) =>
      queryClient.setQueryData(queryKey, selection),
    [queryKey, queryClient]
  );

  return { selectedFiles: selectedRowsQuery.data, setSelectedFiles };
}

export function useSelectedFilesForSystem(api: string, system: string) {
  // Get all selected files matching a given system.
  // Used when multiple listings can be present in a single page, e.g. publications.
  const queryKey = ['selected-rows', api, system];
  const queryClient = useQueryClient();
  const selections = queryClient.getQueriesData<TFileListing[]>({ queryKey });

  const reducedSelections = useMemo(() => {
    const allSelections: TFileListing[] = [];
    selections.forEach((s) => s[1] && allSelections.push(...s[1]));
    return allSelections;
  }, [selections]);
  return reducedSelections;
}
