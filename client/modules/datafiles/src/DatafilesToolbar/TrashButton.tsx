import React, { useCallback } from 'react';
import { useAuthenticatedUser, useTrash } from '@client/hooks';
import { Button, ButtonProps, ConfigProvider } from 'antd';

interface TrashButtonProps<T> extends ButtonProps {
  api: string;
  system: string;
  selectedFiles: T[];
}


const TrashButton: React.FC<TrashButtonProps<{ path: string }>> = React.memo(
  ({ api, system, selectedFiles, disabled, className, onClick, children }) => {
    const { user } = useAuthenticatedUser();
    const { mutate } = useTrash();

    const updateFilesPath = useCallback(
      (dPath: string) => {
        selectedFiles.forEach((file) =>
          mutate({
            src: { api, system, path: encodeURIComponent(file.path) },
            dest: { api, system, path: dPath },
          })
        );
      },
      [selectedFiles, mutate, api, system]
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
        <Button
          onClick={handleTrashClick}
          disabled={disabled}
          className={className}
        >
          <i role="none" className="fa fa-trash" />
          <span>Trash</span>
        </Button>
      </ConfigProvider>
    );
  }
);

export default TrashButton;
