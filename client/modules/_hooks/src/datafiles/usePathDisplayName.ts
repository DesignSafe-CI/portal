import { useCallback } from 'react';
import { useAuthenticatedUser } from '../useAuthenticatedUser';

export const USER_MYDATA_SYSTEM = 'designsafe.storage.default.tms';
export const USER_WORK_SYSTEM = 'cloud.data.tms';

export function getSystemRootDisplayName(
  api: string,
  system: string,
  label: string = 'Data Files'
): string {
  if (api === 'googledrive') return 'Google Drive';
  if (api === 'box') return 'Box';
  if (api === 'dropbox') return 'Dropbox';

  return (
    {
      [USER_MYDATA_SYSTEM]: 'My Data',
      [USER_WORK_SYSTEM]: 'Work',
      'designsafe.storage.community': 'Community Data',
    }[system] ?? label
  );
}

function _getPathDisplayName(
  api: string,
  system: string,
  path: string,
  label: string,
  username?: string,
  homedir?: string
) {
  const usernamePath = encodeURIComponent('/' + username);
  const workdirPath = `/work/${homedir}`;

  if (!path) return getSystemRootDisplayName(api, system, label);
  if (api === 'googledrive' && !path) return 'Google Drive';
  if (api === 'dropbox' && !path) return 'Dropbox';
  if (api === 'box' && !path) return 'Box';

  if (system === USER_MYDATA_SYSTEM && path === usernamePath) {
    return 'My Data';
  }
  if (system === USER_WORK_SYSTEM && path === workdirPath) {
    return 'Work';
  }

  return decodeURIComponent(path).split('/').slice(-1)[0] || label;
}

export function usePathDisplayName() {
  const { user } = useAuthenticatedUser();

  const getPathDisplayName = useCallback(
    (api: string, system: string, path: string, label: string = 'Data Files') =>
      _getPathDisplayName(
        api,
        system,
        path,
        label,
        user?.username,
        user?.homedir
      ),
    [user]
  );

  return getPathDisplayName;
}
