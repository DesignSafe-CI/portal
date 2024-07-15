import { useQueryClient } from '@tanstack/react-query';
import {
  TFileListing,
  useFileListingRouteParams,
  useFilePreview,
} from '@client/hooks';
import { Button, Modal } from 'antd';
import React, { useCallback, useState } from 'react';
import styles from './PreviewModal.module.css';
import { TModalChildren } from '../DatafilesModal';
import { PreviewSpinner, PreviewContent } from './PreviewContent';
import { PreviewMetadata } from './PreviewMetadata';
import { CopyModal } from '../CopyModal';
import { DownloadModal } from '../DownloadModal';
import { MoveModal } from '../MoveModal';

export const PreviewModalBody: React.FC<{
  isOpen: boolean;
  api: string;
  scheme?: string;

  selectedFile: TFileListing;
  handleCancel: () => void;
}> = ({ isOpen, api, scheme, selectedFile, handleCancel }) => {
  /* 
  Typically modals are rendered in the same component as the button that manages the
  open/closed state. The modal body is exported separately for file previews, since 
  the modal might be rendered hundreds of times in a listing and impact performance.
   */
  const queryClient = useQueryClient();
  const { data, isLoading } = useFilePreview({
    api,
    system: selectedFile.system,
    scheme,
    path: selectedFile.path,
    queryOptions: { enabled: isOpen },
  });

  const { path: listingPath } = useFileListingRouteParams();
  const handleClose = useCallback(() => {
    // Flush queries on close to prevent stale postits being read from cache.
    queryClient.removeQueries({ queryKey: ['datafiles', 'preview'] });
    handleCancel();
  }, [handleCancel, queryClient]);

  if (!isOpen) return null;

  return (
    <Modal
      title={<h2>File Preview: {selectedFile.path.split('/').slice(-1)}</h2>}
      width="60%"
      open={isOpen}
      footer={() => (
        <Button onClick={handleClose} type="primary">
          Close
        </Button>
      )}
      onCancel={handleClose}
    >
      <PreviewMetadata
        selectedFile={selectedFile}
        fileMeta={data?.fileMeta ?? {}}
      />
      <div
        style={{
          display: 'flex',
          marginTop: '10px',
          gap: '10px',
          justifyContent: 'center',
        }}
      >
        {scheme === 'private' &&
          api === 'tapis' &&
          !selectedFile.path.endsWith('.hazmapper') && (
            <MoveModal
              api={api}
              system={selectedFile.system}
              path={listingPath}
              selectedFiles={[selectedFile]}
              succesCallback={handleCancel}
            >
              {({ onClick }) => (
                <Button onClick={onClick}>
                  <i role="none" className="fa fa-arrows" />
                  <span>&nbsp;Move</span>
                </Button>
              )}
            </MoveModal>
          )}
        {!selectedFile.path.endsWith('.hazmapper') && (
          <CopyModal
            api={api}
            system={selectedFile.system}
            path={listingPath}
            selectedFiles={[selectedFile]}
          >
            {({ onClick }) => (
              <Button onClick={onClick}>
                <i role="none" className="fa fa-copy" />
                <span>&nbsp;Copy</span>
              </Button>
            )}
          </CopyModal>
        )}
        <DownloadModal
          api={api}
          system={selectedFile.system}
          selectedFiles={[selectedFile]}
        >
          {({ onClick }) => (
            <Button onClick={onClick}>
              <i role="none" className="fa fa-cloud-download" />
              <span>&nbsp;Download</span>
            </Button>
          )}
        </DownloadModal>
      </div>
      <div className={styles.modalContentContainer}>
        {isLoading && <PreviewSpinner />}
        {data && isOpen && (
          <PreviewContent
            href={data.href}
            fileType={data.fileType}
            handleCancel={handleClose}
          ></PreviewContent>
        )}
      </div>
    </Modal>
  );
};

type TPreviewModal = React.FC<{
  api: string;
  scheme?: string;
  selectedFile: TFileListing;
  children: TModalChildren;
}>;
export const PreviewModal: TPreviewModal = ({
  api,
  scheme,
  selectedFile,
  children,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      {isModalOpen && (
        <PreviewModalBody
          api={api}
          scheme={scheme}
          selectedFile={selectedFile}
          isOpen={isModalOpen}
          handleCancel={handleCancel}
        />
      )}
    </>
  );
};
