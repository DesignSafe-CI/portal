import { Modal } from 'antd';
import React from 'react';
import { PrimaryButton } from '@client/common-components';
import {
  useInteractiveModalContext,
  TInteractiveModalContext,
} from '@client/hooks';
import styles from './InteractiveSessionModal.module.css';

export const InteractiveSessionModal: React.FC<{}> = () => {
  const [interactiveModalDetails, setInteractiveModalDetails] =
    useInteractiveModalContext() as TInteractiveModalContext;

  const { interactiveSessionLink, message, openedBySubmit, show } =
    interactiveModalDetails;

  return (
    <Modal
      title={<h2>Open Session</h2>}
      width="500px"
      open={show}
      footer={
        <PrimaryButton
          href={interactiveSessionLink}
          target="_blank"
          disabled={!!!interactiveSessionLink}
        >
          Connect
        </PrimaryButton>
      }
      onCancel={() =>
        setInteractiveModalDetails({
          show: false,
        })
      }
    >
      <div className={styles['session-modal-body']}>
        {interactiveSessionLink ? (
          <span>
            Click the button below to connect to the interactive session.
          </span>
        ) : (
          <>
            <span>
              Your session is loading. You can keep this modal open, and wait
              here for an access button.
            </span>
            {openedBySubmit && (
              <span>
                {
                  '(Or you can close this modal, and wait for a notification to access your job via Job Status.)'
                }
              </span>
            )}
          </>
        )}
        {message && <b>{message}</b>}
        {interactiveSessionLink && (
          <>
            <span>
              To end the job, quit the application within the session.
            </span>
            <span>
              Files may take some time to appear in the output location after
              the job has ended.
            </span>
            <span className={styles.url}>
              For security purposes, this is the URL that the connect button
              will open:
            </span>
            <span className={styles.url}>{interactiveSessionLink}</span>
          </>
        )}
      </div>
    </Modal>
  );
};
