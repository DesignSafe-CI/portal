import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useAuthenticatedUser,
  useFileListingRouteParams,
  useSelectedFiles,
  useTrash,
} from '@client/hooks';
import { Button, ButtonProps, ConfigProvider } from 'antd';

const TrashButton: React.FC<ButtonProps> = () => {
  const { api, system, path } = useFileListingRouteParams();
  const { selectedFiles } = useSelectedFiles(api, system, path);
  const { user } = useAuthenticatedUser();

  const defaultDestParams = useMemo(
    () => ({
      destApi: 'tapis',
      destSystem: 'designsafe.storage.default',
      destPath: encodeURIComponent('/' + user?.username),
    }),
    [user]
  );

  const [dest, setDest] = useState(defaultDestParams);
  const { destApi, destSystem } = dest;
  useEffect(() => setDest(defaultDestParams), [defaultDestParams]);

  const { mutate } = useTrash();
  const updateFilesPath = useCallback(
    (dPath: string) => {
      selectedFiles.forEach((f) =>
        mutate({
          src: { api, system, path: encodeURIComponent(f.path) },
          dest: { api: destApi, system: destSystem, path: dPath },
        })
      );
    },
    [selectedFiles, mutate, destApi, destSystem, api, system]
  );

  const handleTrashClick = () => {
    // const trashPath = path === 'myData' ? '${user.username}/.Trash' : '.Trash';
    const userUsername: string | undefined = user?.username;
    let trashPath: string;
    if (typeof userUsername === 'string') {
      trashPath = userUsername + '/.Trash';
      updateFilesPath(trashPath);
    } else {
      // Handle the case when userUsername is undefined
      trashPath = '.Trash';
      updateFilesPath(trashPath);
    }
  };

  return (
    <ConfigProvider
      theme={{
        components: { Button: { colorPrimaryHover: 'rgba(0, 0, 0, 0.88)' } },
      }}
    >
      <Button onClick={handleTrashClick}>
        <i role="none" className="fa fa-trash" />
        <span>Trash</span>
      </Button>
    </ConfigProvider>
  );
};

export default TrashButton;
