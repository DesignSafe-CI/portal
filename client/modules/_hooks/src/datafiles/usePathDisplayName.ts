import { useCallback } from 'react';
import { useAuthenticatedUser } from '../useAuthenticatedUser';

export function getSystemRootDisplayName(api: string, system: string): string {
  if (api === 'googledrive') return 'Google Drive';
  if (api === 'box') return 'Box';
  if (api === 'dropbox') return 'Dropbox';
  return (
    {
      'designsafe.storage.default': 'My Data',
      'designsafe.storage.frontera.work': 'My Data (Work)',
      'designsafe.storage.community': 'Community Data',
    }[system] ?? 'Data Files'
  );
}

function _getPathDisplayName(
  api: string,
  system: string,
  path: string,
  username?: string
) {
  const usernamePath = encodeURIComponent('/' + username);

  if (!path) return getSystemRootDisplayName(api, system);
  if (api === 'googledrive' && !path) return 'Google Drive';
  if (api === 'dropbox' && !path) return 'Dropbox';
  if (api === 'box' && !path) return 'Box';

  if (system === 'designsafe.storage.default' && path === usernamePath) {
    return 'My Data';
  }
  if (system === 'designsafe.storage.frontera.work' && path === usernamePath) {
    return 'HPC Work';
  }

  return decodeURIComponent(path).split('/').slice(-1)[0] || 'Data Files';
}

export function usePathDisplayName() {
  const { user } = useAuthenticatedUser();

  const getPathDisplayName = useCallback(
    (api: string, system: string, path: string) =>
      _getPathDisplayName(api, system, path, user?.username),
    [user]
  );

  return getPathDisplayName;
}
