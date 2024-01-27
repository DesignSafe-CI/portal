import { useQueryClient } from '@tanstack/react-query';
import {
  useFilePreview,
  useConsumePostit,
  TPreviewFileType,
} from '@client/hooks';
import { Button, Modal, Spin } from 'antd';
import React, { ReactElement, useState } from 'react';
import styles from './PreviewModal.module.css';

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
  children: ReactElement;
}>;
export const PreviewModal: TPreviewModal = ({
  api,
  system,
  scheme,
  path,
  children,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useFilePreview({
    api,
    system,
    scheme,
    path,
    queryOptions: { enabled: isModalOpen },
  });

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    // Flush queries on close to prevent stale postits being read from cache.
    queryClient.removeQueries({ queryKey: ['datafiles', 'preview'] });
    setIsModalOpen(false);
  };
  return (
    <>
      {React.cloneElement(children as ReactElement, { onClick: showModal })}
      <Modal
        title={<h2>File Preview: {children.props.children}</h2>}
        width="60%"
        open={isModalOpen}
        footer={() => (
          <Button onClick={handleCancel} type="primary">
            Close
          </Button>
        )}
        onCancel={handleCancel}
      >
        <div className={styles.modalContentContainer}>
          {isLoading && <PreviewSpinner />}
          {data && isModalOpen && (
            <PreviewPanel
              href={data.href}
              fileType={data.fileType}
            ></PreviewPanel>
          )}
        </div>
      </Modal>
    </>
  );
};
