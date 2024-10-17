import React from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import PropTypes from 'prop-types';
import { formatDateTime } from 'utils/timeFormat';
import { onboardingUserPropType, stepPropType } from './OnboardingPropTypes';
import styles from './OnboardingEventLogModal.module.scss';

const OnboardingEventLogModal = ({ toggle, params }) => {
  return (
    <Modal isOpen={params !== null} toggle={toggle}>
      <ModalHeader toggle={toggle} charCode="&#xe912;">
        View Log
      </ModalHeader>
      <ModalBody className={styles['event-container']}>
        <h6 className={styles['log-detail']}>
          {`${params.user.firstName} ${params.user.lastName} - ${params.step.displayName}`}
        </h6>
        <div className={styles['event-list']}>
          {params.step.events.map((event) => (
            <div key={event.time}>
              <div>{formatDateTime(new Date(event.time))}</div>
              <div>{event.message}</div>
            </div>
          ))}
        </div>
      </ModalBody>
    </Modal>
  );
};

OnboardingEventLogModal.propTypes = {
  toggle: PropTypes.func.isRequired,
  params: PropTypes.shape({
    user: onboardingUserPropType,
    step: stepPropType,
  }).isRequired,
};

export default OnboardingEventLogModal;
