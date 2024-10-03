import React from 'react';
import { Modal } from 'antd';
import { PrimaryButton, Icon } from '@client/common-components';
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
      title={
        <h3>
          Interactive Session is {interactiveSessionLink ? 'Ready' : 'Queueing'}
        </h3>
      }
      width="650px"
      open={show}
      footer={null}
      onCancel={() =>
        setInteractiveModalDetails({
          show: false,
        })
      }
    >
      <div className={styles['session-modal-body']}>
        <div style={{ alignSelf: 'center' }}>
          <PrimaryButton
            href={interactiveSessionLink}
            target="_blank"
            loading={!!!interactiveSessionLink}
            style={{ width: 150, margin: '25px 0' }}
            size="large"
          >
            Connect
            <Icon
              className={`ds-icon-New-Tab ${styles.icon}`}
              label="Connect"
            />
          </PrimaryButton>
        </div>
        {openedBySubmit && !!!interactiveSessionLink && (
          <span>
            While you wait, you can either:
            <ul>
              <li>Keep this modal open and wait to connect.</li>
              <li>
                Close this window and wait for a notification via{' '}
                <strong>Job Status</strong>.
              </li>
            </ul>
          </span>
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
