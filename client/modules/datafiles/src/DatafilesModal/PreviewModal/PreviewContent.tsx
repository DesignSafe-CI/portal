import { useConsumePostit, TPreviewFileType } from '@client/hooks';
import { Alert, Spin } from 'antd';
import { HAZMAPPER_BASE_URL_MAP } from '../../projects/utils';
import React, { useState } from 'react';
import styles from './PreviewModal.module.css';

export const PreviewSpinner: React.FC = () => (
  <Spin className={styles.spinner} />
);

export type TPreviewContent = React.FC<{
  href: string;
  fileType: TPreviewFileType;
  handleCancel: () => void;
}>;
export const PreviewContent: TPreviewContent = ({ href, fileType, handleCancel }) => {
  const [iframeLoading, setIframeLoading] = useState(true);

  const { data: PostitData, isLoading: isConsumingPostit } = useConsumePostit({
    href,
    responseType: fileType === 'video' ? 'blob' : 'text',
    queryOptions: {
      enabled: (!!href && fileType === 'text') || fileType === 'video' || fileType === 'hazmapper',
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
    case 'hazmapper':
      if (!PostitData) return
      const body = JSON.parse(PostitData as string);
      let baseUrl =
      HAZMAPPER_BASE_URL_MAP[
        body.deployment as keyof typeof HAZMAPPER_BASE_URL_MAP
      ];
      if (!baseUrl) {
        console.error(
          `Invalid deployment type: ${body.deployment}.  Falling back to local`
        );
        baseUrl = HAZMAPPER_BASE_URL_MAP['local'];
      }
        window.open(`${baseUrl}/project/${body.uuid}`, '_blank');
        handleCancel();
    default:
      return (
        <Alert
          style={{ marginTop: '25px' }}
          type="warning"
          showIcon
          message="Unsupported File Type"
          description="Preview for this item is not supported."
        />
      );
  }
};
