import { useConsumePostit, TPreviewFileType } from '@client/hooks';
import { Spin } from 'antd';
import React, { useState } from 'react';
import styles from './PreviewModal.module.css';

export const PreviewSpinner: React.FC = () => (
  <Spin className={styles.spinner} />
);

export type TPreviewContent = React.FC<{
  href: string;
  fileType: TPreviewFileType;
}>;
export const PreviewContent: TPreviewContent = ({ href, fileType }) => {
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
          {iframeLoading && <PreviewSpinner />}
          <img src={href} alt={href} onLoad={() => setIframeLoading(false)} />
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
