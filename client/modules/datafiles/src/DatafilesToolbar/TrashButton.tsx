import React, { useCallback } from 'react';
import {
  useAuthenticatedUser,
  useCheckFilesForAssociation,
  useNotifyContext,
  useTrash,
} from '@client/hooks';
import { Button, ButtonProps, ConfigProvider } from 'antd';
import { useParams } from 'react-router-dom';

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

    let { projectId } = useParams();
    if (!projectId) projectId = '';

    const hasAssociations = useCheckFilesForAssociation(
      projectId,
      selectedFiles.map((f) => f.path)
    );

    const { notifyApi } = useNotifyContext();

    const handleTrashClick = () => {
      // const trashPath = path === 'myData' ? '${user.username}/.Trash' : '.Trash';

      if (hasAssociations) {
        notifyApi?.open({
          type: 'error',
          message: 'Cannot Trash File(s)',
          duration: 10,
          description: (
            <div>
              The selected file(s) are associated to one or more categories.
              Please remove category associations before proceeding.
            </div>
          ),
          placement: 'bottomLeft',
        });
        return;
      }

      const userUsername: string | undefined = user?.username;
      let trashPath: string;
      if (typeof userUsername === 'string' && !system.startsWith('project-')) {
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
          components: {
            Button: {
              colorPrimaryHover: 'rgba(0, 0, 0, 0.88)',
              motionDurationMid: '0',
            },
          },
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
