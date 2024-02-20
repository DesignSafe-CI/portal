import React, { useMemo, useCallback, useEffect, useState } from 'react';
import styles from './DatafilesToolbar.module.css';
import {
  useAuthenticatedUser,
  useFileListingRouteParams,
  useSelectedFiles,
  useTrash,
} from '@client/hooks';
import DatafilesModal from '../DatafilesModal/DatafilesModal';
import { Button, ButtonProps, ConfigProvider, ThemeConfig } from 'antd';

const toolbarTheme: ThemeConfig = {
  components: {
    Button: {
      colorPrimaryHover: 'rgba(0, 0, 0, 0.88)',
    },
  },
};
const ToolbarButton: React.FC<ButtonProps> = (props) => {
  return (
    <ConfigProvider theme={toolbarTheme}>
      <Button {...props} />
    </ConfigProvider>
  );
};

export const DatafilesToolbar: React.FC = () => {
  const { api, system, scheme, path } = useFileListingRouteParams();
  const { selectedFiles } = useSelectedFiles(api, system, path);
  const { user } = useAuthenticatedUser();

  const rules = useMemo(
    function () {
      // Rules for which toolbar buttons are active for a given selection.
      return {
        canPreview:
          selectedFiles.length === 1 && selectedFiles[0].type === 'file',
        canRename: selectedFiles.length === 1,
        canCopy: user && selectedFiles.length >= 1,
        canTrash: user && selectedFiles.length >= 1,
      };
    },
    [selectedFiles, user]
  );

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
    <div className={styles.toolbarRoot}>
      <span>(search bar goes here)</span>

      <div className={styles.toolbarButtonContainer}>
        <DatafilesModal.Rename api={api} system={system} path={path}>
          {({ onClick }) => (
            <ToolbarButton
              onClick={onClick}
              disabled={!rules.canRename}
              className={styles.toolbarButton}
            >
              <i role="none" className="fa fa-pencil" />
              <span>Rename</span>
            </ToolbarButton>
          )}
        </DatafilesModal.Rename>
        <DatafilesModal.Preview
          api={api}
          system={system}
          scheme={scheme}
          path={selectedFiles[0]?.path ?? ''}
        >
          {({ onClick }) => (
            <ToolbarButton
              onClick={onClick}
              disabled={!rules.canPreview}
              className={styles.toolbarButton}
            >
              <i role="none" className="fa fa-binoculars" />
              <span>Preview</span>
            </ToolbarButton>
          )}
        </DatafilesModal.Preview>
        <DatafilesModal.Copy api={api} system={system} path={path}>
          {({ onClick }) => (
            <ToolbarButton
              onClick={onClick}
              disabled={!rules.canCopy}
              className={styles.toolbarButton}
            >
              <i role="none" className="fa fa-copy" />
              <span>Copy</span>
            </ToolbarButton>
          )}
        </DatafilesModal.Copy>
        <ToolbarButton
          onClick={handleTrashClick}
          disabled={!rules.canTrash}
          className={styles.toolbarButton}
        >
          <i role="none" className="fa fa-trash" />
          <span>Trash</span>
        </ToolbarButton>
      </div>
    </div>
  );
};
