import { useParams, useSearchParams } from 'react-router-dom';
import { usePublicationDetail } from './usePublicationDetail';
import { useMemo } from 'react';

const pathRegex = /--V([0-9]*)/;
export function usePublicationVersions(projectId: string) {
  const { data } = usePublicationDetail(projectId);
  const { path } = useParams();
  const [searchParams] = useSearchParams();

  const [selectedVersion, allVersions] = useMemo(() => {
    const _versionMap = data?.tree.children.map((child) => child.version ?? 1);
    const _dedupedVersions = [...new Set(_versionMap)].sort();

    const selectedVersionParam = searchParams.get('version');
    const versionFromPath = path && (path.match(pathRegex)?.[1] || '1');

    let _selectedVersion = 1;
    if (!selectedVersionParam) {
      _selectedVersion = Math.max(...(_dedupedVersions ?? [1]));
    } else {
      _selectedVersion = parseInt(selectedVersionParam);
    }
    if (versionFromPath) {
      _selectedVersion = parseInt(versionFromPath);
    }
    return [_selectedVersion, _dedupedVersions];
  }, [searchParams, data, path]);

  return { selectedVersion, allVersions };
}
