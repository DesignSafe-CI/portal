import React from 'react';
import { Modal } from 'antd';
import { formatDateTime } from '@client/workspace';
import { TOnboardingStep, TOnboardingUser } from '@client/hooks';
import styles from './OnboardingEventLogModal.module.css';

export const OnboardingEventLogModal: React.FC<{
  params: {
    user: TOnboardingUser;
    step: TOnboardingStep;
  };
  handleCancel: () => void;
}> = ({ params: { user, step }, handleCancel }) => {
  return (
    <Modal
      className={`${styles.root} ${styles['event-container']}`}
      title={<header>View Log</header>}
      width="60%"
      open={!!step}
      onCancel={handleCancel}
      footer={null}
    >
      <h6 className={styles['log-detail']}>
        {`${user.firstName} ${user.lastName} - ${step.displayName}`}
      </h6>
      <div className={styles['event-list']}>
        {step.events.map((event) => (
          <div key={event.time}>
            <div>{formatDateTime(new Date(event.time))}</div>
            <div>{event.message}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
