import React, { useMemo } from 'react';
import styles from './DatafilesToolbar.module.css';
import {
  useAuthenticatedUser,
  useFileListingRouteParams,
  useSelectedFiles,
} from '@client/hooks';
import DatafilesModal from '../DatafilesModal/DatafilesModal';
import TrashButton from './TrashButton';
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
        canRename: user && selectedFiles.length === 1,
        canCopy: user && selectedFiles.length >= 1,
        canTrash: user && selectedFiles.length >= 1,
      };
    },
    [selectedFiles, user]
  );

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
        <TrashButton
          api={api}
          system={system}
          selectedFiles={selectedFiles}
          className={styles.toolbarButton}
        >
          <i role="none" className="fa fa-trash" />
          <span>Trash</span>
        </TrashButton>
      </div>
    </div>
  );
};
