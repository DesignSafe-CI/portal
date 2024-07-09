import React, { useMemo } from 'react';
import styles from './DatafilesToolbar.module.css';
import {
  useAuthenticatedUser,
  useFileListingRouteParams,
  useProjectDetail,
  useSelectedFiles,
  useSelectedFilesForSystem,
} from '@client/hooks';
import DatafilesModal from '../DatafilesModal/DatafilesModal';
import TrashButton from './TrashButton';
import { Button, ButtonProps, ConfigProvider, ThemeConfig } from 'antd';
import { useMatches, useParams } from 'react-router-dom';

const toolbarTheme: ThemeConfig = {
  components: {
    Button: {
      colorPrimaryHover: 'rgba(0, 0, 0, 0.88)',
      motionDurationMid: '0',
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

export const DatafilesToolbar: React.FC<{ searchInput?: React.ReactNode }> = ({
  searchInput,
}) => {
  const routeParams = useFileListingRouteParams();
  const { scheme, path } = routeParams;
  let { api, system } = routeParams;
  let { projectId } = useParams();

  const { user } = useAuthenticatedUser();

  const matches = useMatches();
  const isProjects = matches.find((m) => m.id === 'project');
  const isPublished = matches.find((m) => m.id === 'published');
  const isEntityListing = matches.find((m) => m.id === 'entity-listing');
  const isNees = matches.find((m) => m.id === 'nees');

  const isReadOnly =
    isPublished || isNees || system === 'designsafe.storage.community';

  if (!isProjects) projectId = '';
  const { data } = useProjectDetail(projectId ?? '');
  if (projectId) {
    system = `project-${data?.baseProject.uuid}`;
    api = 'tapis';
  }
  if (isPublished) {
    system = 'designsafe.storage.published';
    api = 'tapis';
  }

  /* 
  Project landing pages have multiple selectable listings, so use the 
  useSelectedFilesForSystem hook to capture every selection on the page.
  */
  const { selectedFiles: listingSelectedFiles } = useSelectedFiles(
    api,
    system,
    path
  );
  const publicationSelectedFiles = useSelectedFilesForSystem('tapis', system);
  const selectedFiles = isEntityListing
    ? publicationSelectedFiles
    : listingSelectedFiles;

  const rules = useMemo(
    function () {
      // Rules for which toolbar buttons are active for a given selection.
      return {
        canPreview:
          selectedFiles.length === 1 && selectedFiles[0].type === 'file',
        canRename: user && selectedFiles.length === 1 && !isReadOnly,
        canCopy: user && selectedFiles.length >= 1,
        canTrash: user && selectedFiles.length >= 1 && !isReadOnly,
        // Disable downloads from frontera.work until we have a non-flaky mount on ds-download.
        canDownload:
          selectedFiles.length >= 1 &&
          system !== 'designsafe.storage.frontera.work',
      };
    },
    [selectedFiles, isReadOnly, user, system]
  );

  return (
    <div className={styles.toolbarRoot}>
      <div style={{ marginLeft: '12px' }}>{searchInput ?? null}</div>

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

        <DatafilesModal.Move
          api={api}
          system={system}
          path={path}
          selectedFiles={selectedFiles}
        >
          {({ onClick }) => (
            <ToolbarButton
              onClick={onClick}
              disabled={!rules.canRename}
              className={styles.toolbarButton}
            >
              <i role="none" className="fa fa-arrows" />
              <span>Move</span>
            </ToolbarButton>
          )}
        </DatafilesModal.Move>
        <DatafilesModal.Preview
          api={api}
          scheme={scheme}
          selectedFile={selectedFiles[0]}
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
        <DatafilesModal.Copy
          api={api}
          system={system}
          path={path}
          selectedFiles={selectedFiles}
        >
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
          disabled={!rules.canTrash}
        >
          <i role="none" className="fa fa-trash" />
          <span>Trash</span>
        </TrashButton>
        <DatafilesModal.Download
          api={api}
          system={system}
          selectedFiles={selectedFiles}
        >
          {({ onClick }) => (
            <ToolbarButton
              onClick={onClick}
              disabled={!rules.canDownload}
              className={styles.toolbarButton}
            >
              <i role="none" className="fa fa-cloud-download" />
              <span>Download</span>
            </ToolbarButton>
          )}
        </DatafilesModal.Download>
      </div>
    </div>
  );
};
