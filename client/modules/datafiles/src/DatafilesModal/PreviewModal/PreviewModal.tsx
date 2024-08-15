import { useQueryClient } from '@tanstack/react-query';
import { useFilePreview } from '@client/hooks';
import { Button, Modal } from 'antd';
import React, { useCallback, useState } from 'react';
import styles from './PreviewModal.module.css';
import { TModalChildren } from '../DatafilesModal';
import { PreviewSpinner, PreviewContent } from './PreviewContent';

export const PreviewModalBody: React.FC<{
  isOpen: boolean;
  api: string;
  system: string;
  scheme?: string;
  path: string;
  handleCancel: () => void;
}> = ({ isOpen, api, system, scheme, path, handleCancel }) => {
  /* 
  Typically modals are rendered in the same component as the button that manages the
  open/closed state. The modal body is exported separately for file previews, since 
  the modal might be rendered hundreds of times in a listing and impact performance.
   */
  const queryClient = useQueryClient();
  const { data, isLoading } = useFilePreview({
    api,
    system,
    scheme,
    path,
    queryOptions: { enabled: isOpen },
  });

  const handleClose = useCallback(() => {
    // Flush queries on close to prevent stale postits being read from cache.
    queryClient.removeQueries({ queryKey: ['datafiles', 'preview'] });
    handleCancel();
  }, [handleCancel, queryClient]);

  if (!isOpen) return null;

  return (
    <Modal
      title={<h2>File Preview: {path}</h2>}
      width="60%"
      open={isOpen}
      footer={() => (
        <Button onClick={handleClose} type="primary">
          Close
        </Button>
      )}
      onCancel={handleClose}
    >
      <div className={styles.modalContentContainer}>
        {isLoading && <PreviewSpinner />}
        {data && isOpen && (
          <PreviewContent
            href={data.href}
            fileType={data.fileType}
          ></PreviewContent>
        )}
      </div>
    </Modal>
  );
};

type TPreviewModal = React.FC<{
  api: string;
  system: string;
  scheme?: string;
  path: string;
  children: TModalChildren;
}>;
export const PreviewModal: TPreviewModal = ({
  api,
  system,
  scheme,
  path,
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
          system={system}
          scheme={scheme}
          path={path}
          isOpen={isModalOpen}
          handleCancel={handleCancel}
        />
      )}
    </>
  );
};
