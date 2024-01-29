import { useQueryClient } from '@tanstack/react-query';
import {
  useFilePreview,
  useConsumePostit,
  TPreviewFileType,
} from '@client/hooks';
import { Button, Modal, Spin } from 'antd';
import React, { useCallback, useState } from 'react';
import styles from './PreviewModal.module.css';
import { TModalChildren } from './DatafilesModal';

const PreviewSpinner: React.FC = () => <Spin className={styles.spinner} />;

type TPreviewPanel = React.FC<{ href: string; fileType: TPreviewFileType }>;
const PreviewPanel: TPreviewPanel = ({ href, fileType }) => {
  const [iframeLoading, setIframeLoading] = useState(true);

  const { data: PostitData, isLoading: isConsumingPostit } = useConsumePostit({
    href,
    responseType: fileType === 'video' ? 'blob' : 'text',
    queryOptions: {
      enabled: (!!href && fileType === 'text') || fileType === 'video',
    },
  });

  if (isConsumingPostit) return <PreviewSpinner />;

  switch (fileType) {
    case 'text':
      return (
        PostitData && (
          <div className={styles.previewContainer}>
            <pre>{PostitData as string}</pre>
          </div>
        )
      );
    case 'video':
      return (
        PostitData && (
          <div className={styles.previewContainer}>
            <video
              id="videoPlayer"
              src={URL.createObjectURL(PostitData as Blob)}
              controls
              autoPlay
            ></video>
          </div>
        )
      );
    case 'image':
      return (
        <div className={styles.previewContainer}>
          <img src={href} alt={href} />
        </div>
      );
    case 'box':
    case 'ms-office':
    case 'ipynb':
    case 'object':
      return (
        <div className={styles.previewContainer}>
          {iframeLoading && <PreviewSpinner />}
          <iframe
            onLoad={() => setIframeLoading(false)}
            title="preview"
            src={href}
            id="framepreview"
          ></iframe>
        </div>
      );
    default:
      return <span>Error.</span>;
  }
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
      {React.createElement(children, {onClick: showModal})}
      <PreviewModalBody
        api={api}
        system={system}
        scheme={scheme}
        path={path}
        isOpen={isModalOpen}
        handleCancel={handleCancel}
      />
    </>
  );
};

export type TPreviewModalProps = {
  isOpen: boolean;
  api: string;
  system: string;
  scheme?: string;
  path: string;
  handleCancel: () => void;
};

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
          <PreviewPanel
            href={data.href}
            fileType={data.fileType}
          ></PreviewPanel>
        )}
      </div>
    </Modal>
  );
};
