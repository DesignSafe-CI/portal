import { Modal } from 'antd';
import React from 'react';
import { PrimaryButton } from '@client/common-components';
import styles from './InteractiveSessionModal.module.css';

export const InteractiveSessionModal: React.FC<{
  isOpen: boolean;
  interactiveSessionLink: string;
  message?: string;
  onCancel: VoidFunction;
}> = ({ isOpen, interactiveSessionLink, message, onCancel }) => {
  return (
    <Modal
      title={<h2>Open Session</h2>}
      width="500px"
      open={isOpen}
      footer={
        <PrimaryButton href={interactiveSessionLink} target="_blank">
          Connect
        </PrimaryButton>
      }
      onCancel={onCancel}
    >
      <div className={styles['session-modal-body']}>
        <span>
          Click the button below to connect to the interactive session.
        </span>
        {message && <b>{message}</b>}
        <span>To end the job, quit the application within the session.</span>
        <span>
          Files may take some time to appear in the output location after the
          job has ended.
        </span>
        <span className={styles.url}>
          For security purposes, this is the URL that the connect button will
          open:
        </span>
        <span className={styles.url}>{interactiveSessionLink}</span>
      </div>
    </Modal>
  );
};
