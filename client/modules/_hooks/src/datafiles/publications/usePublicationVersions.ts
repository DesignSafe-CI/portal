import { useSearchParams } from 'react-router-dom';
import { usePublicationDetail } from './usePublicationDetail';
import { useMemo } from 'react';

export function usePublicationVersions(projectId: string) {
  const { data } = usePublicationDetail(projectId);
  const [searchParams] = useSearchParams();

  const [selectedVersion, allVersions] = useMemo(() => {
    const _versionMap = data?.tree.children.map((child) => child.version ?? 1);
    const _dedupedVersions = [...new Set(_versionMap)].sort();

    const selectedVersionParam = searchParams.get('version');
    let _selectedVersion = 1;
    if (!selectedVersionParam) {
      _selectedVersion = Math.max(...(_dedupedVersions ?? [1]));
    } else {
      _selectedVersion = parseInt(selectedVersionParam);
    }
    return [_selectedVersion, _dedupedVersions];
  }, [searchParams, data]);

  return { selectedVersion, allVersions };
}
