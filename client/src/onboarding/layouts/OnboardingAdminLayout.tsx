import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  LoadingSpinner,
  SectionMessage,
  Message,
  Paginator,
  Checkbox,
} from '_common';
import { v4 as uuidv4 } from 'uuid';
import PropTypes from 'prop-types';
import { onboardingUserPropType } from './OnboardingPropTypes';
import OnboardingEventLogModal from './OnboardingEventLogModal';
import OnboardingStatus from './OnboardingStatus';
import OnboardingAdminSearchbar from './OnboardingAdminSearchbar';
import styles from './OnboardingAdmin.module.scss';
import './OnboardingAdmin.scss';

const OnboardingApproveActions = ({ callback, disabled, action }) => {
  return (
    <div className={styles['approve-container']}>
      <Button
        type="secondary"
        size="small"
        className={styles.approve}
        iconNameBefore="approved-reverse"
        onClick={() => callback('staff_approve')}
        disabled={disabled}
        isLoading={action === 'staff_approve'}
      >
        Approve
      </Button>
      <Button
        type="secondary"
        size="small"
        className={styles.approve}
        iconNameBefore="denied-reverse"
        onClick={() => callback('staff_deny')}
        disabled={disabled}
        isLoading={action === 'staff_approve'}
      >
        Deny
      </Button>
    </div>
  );
};

OnboardingApproveActions.propTypes = {
  callback: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  action: PropTypes.string,
};

OnboardingApproveActions.defaultProps = {
  disabled: false,
  action: null,
};

const OnboardingResetLinks = ({ callback, disabled, disableSkip, action }) => {
  return (
    <div className={styles.reset}>
      <Button
        type="link"
        className={styles['action-link']}
        onClick={() => callback('reset')}
        isLoading={action === 'reset'}
        disabled={disabled}
      >
        Reset
      </Button>
      <>|</>
      <Button
        type="link"
        className={styles['action-link']}
        disabled={disabled || disableSkip}
        onClick={() => callback('complete')}
        isLoading={action === 'complete'}
      >
        Skip
      </Button>
    </div>
  );
};

OnboardingResetLinks.propTypes = {
  callback: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  disableSkip: PropTypes.bool,
  action: PropTypes.string,
};

OnboardingResetLinks.defaultProps = {
  disabled: false,
  disableSkip: false,
  action: null,
};

const OnboardingAdminListUser = ({ user, viewLogCallback }) => {
  const dispatch = useDispatch();
  const actionCallback = useCallback(
    (step, username, action) => {
      dispatch({
        type: 'POST_ONBOARDING_ACTION',
        payload: {
          step,
          action,
          username,
        },
      });
    },
    [dispatch]
  );
  const adminAction = useSelector((state) => state.onboarding.action);
  const stepCount = user.steps.length;

  return (
    <>
      {user.steps.map((step, index) => (
        <tr className={styles.user} key={uuidv4()}>
          {index === 0 && (
            <td rowSpan={stepCount} className={styles.name}>
              {`${user.firstName} ${user.lastName}`}
              <br />
              <span className={styles.username}>{user.username}</span>
            </td>
          )}
          <td className={step.state === 'staffwait' ? styles.staffwait : ''}>
            {step.displayName}
          </td>
          <td
            className={`${styles.status} ${
              step.state === 'staffwait' ? styles.staffwait : ''
            }`}
          >
            <OnboardingStatus step={step} />
          </td>
          <td
            className={`${styles['has-wrappable-content']} ${
              step.state === 'staffwait' ? styles.staffwait : ''
            }`}
          >
            {step.state === 'staffwait' && (
              <OnboardingApproveActions
                callback={(action) =>
                  actionCallback(step.step, user.username, action)
                }
                disabled={
                  // Disable all admin actions while any action is being performed
                  adminAction.loading
                }
                action={
                  // If this user and step currently is running an admin action, pass down the action
                  adminAction.username === user.username &&
                  adminAction.step === step.step
                    ? adminAction.action
                    : null
                }
              />
            )}
          </td>
          <td className={step.state === 'staffwait' ? styles.staffwait : ''}>
            <OnboardingResetLinks
              callback={(action) =>
                actionCallback(step.step, user.username, action)
              }
              disabled={adminAction.loading}
              disableSkip={step.state === 'completed'}
              sentAction={
                adminAction.username === user.username &&
                adminAction.step === step.step
                  ? adminAction.action
                  : null
              }
            />
          </td>
          <td className={step.state === 'staffwait' ? styles.staffwait : ''}>
            <Button
              type="link"
              className={styles['action-link']}
              onClick={() => viewLogCallback(user, step)}
            >
              View Log
            </Button>
          </td>
        </tr>
      ))}
    </>
  );
};

OnboardingAdminListUser.propTypes = {
  user: onboardingUserPropType.isRequired,
  viewLogCallback: PropTypes.func.isRequired,
};

const OnboardingAdminList = ({ users, viewLogCallback }) => {
  const columnCount = 6;
  const colElements = [];
  for (let i = 0; i < columnCount; i += 1) {
    colElements.push(<col key={i} />);
  }

  return (
    <table className={styles.users}>
      <colgroup>{colElements}</colgroup>
      <thead>
        <tr>
          <th>User</th>
          <th>Step</th>
          <th>Status</th>
          <th colSpan="2">Administrative Actions</th>
          <th>Log</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <OnboardingAdminListUser
            user={user}
            key={user.username}
            viewLogCallback={viewLogCallback}
          />
        ))}
      </tbody>
    </table>
  );
};

OnboardingAdminList.propTypes = {
  users: PropTypes.arrayOf(onboardingUserPropType).isRequired,
  viewLogCallback: PropTypes.func.isRequired,
};

const OnboardingAdmin = () => {
  const dispatch = useDispatch();
  const [eventLogModalParams, setEventLogModalParams] = useState(null);
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  const toggleShowIncomplete = () => {
    dispatch({
      type: 'FETCH_ONBOARDING_ADMIN_LIST',
      payload: {
        offset: 0,
        limit,
        query,
        showIncompleteOnly: !showIncompleteOnly, // Toggle the parameter
      },
    });
    setShowIncompleteOnly((prev) => !prev);
  };

  const { users, offset, limit, total, query, loading, error } = useSelector(
    (state) => state.onboarding.admin
  );
  const paginationCallback = useCallback(
    (page) => {
      dispatch({
        type: 'FETCH_ONBOARDING_ADMIN_LIST',
        payload: {
          offset: (page - 1) * limit,
          limit,
          query,
          showIncompleteOnly,
        },
      });
    },
    [offset, limit, query, showIncompleteOnly]
  );

  const viewLogCallback = useCallback(
    (user, step) => {
      setEventLogModalParams({ user, step });
    },
    [setEventLogModalParams]
  );

  const toggleViewLogModal = useCallback(() => {
    setEventLogModalParams();
  }, [setEventLogModalParams]);

  useEffect(() => {
    dispatch({
      type: 'FETCH_ONBOARDING_ADMIN_LIST',
      payload: { offset, limit, query: null, showIncompleteOnly },
    });
  }, [dispatch]);

  const current = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);
  if (loading) {
    return <LoadingSpinner />;
  }
  if (error) {
    return (
      <div className={styles['root-placeholder']}>
        <SectionMessage type="warn">
          Unable to access Onboarding administration
        </SectionMessage>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles['container']}>
        <div className={styles['container-header']}>
          <h5>Administrator Controls</h5>
          <div className={styles['search-checkbox-container']}>
            <OnboardingAdminSearchbar />
            <label
              className={styles['checkbox-label-container']}
              htmlFor="incompleteuser"
            >
              <Checkbox
                isChecked={showIncompleteOnly}
                id="incompleteuser"
                role="checkbox"
                aria-label="Show Incomplete Only"
                tabIndex={0}
                onClick={toggleShowIncomplete}
              />
              <span className={styles['label']}>Show Only Incomplete</span>
            </label>
          </div>
        </div>
        {users.length === 0 && (
          <div className={styles['no-users-placeholder']}>
            <Message type="warn">No users to show.</Message>
          </div>
        )}
        <div className={styles['user-container']}>
          {users.length > 0 && (
            <OnboardingAdminList
              users={users}
              viewLogCallback={viewLogCallback}
            />
          )}
        </div>
        {users.length > 0 && (
          <div className={styles['paginator-container']}>
            <Paginator
              current={current}
              pages={pages}
              callback={paginationCallback}
              spread={5}
            />
          </div>
        )}
        {eventLogModalParams && (
          <OnboardingEventLogModal
            params={eventLogModalParams}
            toggle={toggleViewLogModal}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingAdmin;
