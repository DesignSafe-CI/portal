import React, { useEffect, useCallback, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { Alert, Layout, Checkbox } from 'antd';
import { SecondaryButton, Spinner } from '@client/common-components';
import {
  OnboardingStatus,
  OnboardingEventLogModal,
  OnboardingAdminSearchbar,
} from '@client/onboarding';
import styles from './OnboardingAdminLayout.module.css';
import {
  TOnboardingStep,
  TOnboardingUser,
  TOnboardingAdminActions,
  useSendOnboardingAction,
  useGetOnboardingAdminList,
  TOnboardingAdminList,
  TOnboardingAdminParams,
} from '@client/hooks';

const OnboardingApproveActions: React.FC<{
  callback: (action: TOnboardingAdminActions) => void;
  disabled: boolean;
  action?: TOnboardingAdminActions;
}> = ({ callback, disabled, action }) => {
  return (
    <div className={styles['approve-container']}>
      <SecondaryButton
        size="small"
        className={styles.approve}
        onClick={() => callback('staff_approve')}
        disabled={disabled}
        loading={action === 'staff_approve'}
        icon="approve"
      >
        Approve
      </SecondaryButton>
      <SecondaryButton
        size="small"
        className={styles.approve}
        onClick={() => callback('staff_deny')}
        disabled={disabled}
        loading={action === 'staff_approve'}
        icon="deny"
      >
        Deny
      </SecondaryButton>
    </div>
  );
};

const OnboardingResetLinks: React.FC<{
  callback: (action: TOnboardingAdminActions) => void;
  disabled: boolean;
  action?: TOnboardingAdminActions;
}> = ({ callback, disabled, action }) => {
  return (
    <div className={styles.reset}>
      <SecondaryButton
        type="link"
        className={styles['action-link']}
        onClick={() => callback('reset')}
        loading={action === 'reset'}
        disabled={disabled}
      >
        Reset
      </SecondaryButton>
      <>|</>
      <SecondaryButton
        type="link"
        className={styles['action-link']}
        disabled={disabled}
        onClick={() => callback('complete')}
        loading={action === 'complete'}
      >
        Skip
      </SecondaryButton>
    </div>
  );
};

const OnboardingAdminListUser: React.FC<{
  user: TOnboardingUser;
  viewLogCallback: (user: TOnboardingUser, step: TOnboardingStep) => void;
}> = ({ user, viewLogCallback }) => {
  const {
    mutate: sendOnboardingAction,
    isPending,
    variables,
  } = useSendOnboardingAction();
  const actionCallback = useCallback(
    (step: string, username: string, action: TOnboardingAdminActions) => {
      sendOnboardingAction({
        body: { action, step: step },
        username,
      });
    },
    [sendOnboardingAction]
  );

  const stepCount = user.steps.length;

  return (
    <>
      {user.steps.map((step, index) => (
        <tr className={styles.user} key={step.step}>
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
                  isPending
                }
                action={
                  // If this user and step currently is running an admin action, pass down the action
                  variables?.username === user.username &&
                  variables.body.step === step.step
                    ? variables.body.action
                    : undefined
                }
              />
            )}
          </td>
          <td className={step.state === 'staffwait' ? styles.staffwait : ''}>
            <OnboardingResetLinks
              callback={(action) =>
                actionCallback(step.step, user.username, action)
              }
              disabled={isPending || step.state === 'completed'}
              action={
                variables?.username === user.username &&
                variables.body.step === step.step
                  ? variables.body.action
                  : undefined
              }
            />
          </td>
          <td className={step.state === 'staffwait' ? styles.staffwait : ''}>
            <SecondaryButton
              type="link"
              className={styles['action-link']}
              onClick={() => viewLogCallback(user, step)}
            >
              View Log
            </SecondaryButton>
          </td>
        </tr>
      ))}
    </>
  );
};

const OnboardingAdminList: React.FC<{
  users: TOnboardingUser[];
  viewLogCallback: (user: TOnboardingUser, step: TOnboardingStep) => void;
}> = ({ users, viewLogCallback }) => {
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
          <th colSpan={2}>Administrative Actions</th>
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

const OnboardingAdmin = () => {
  const [eventLogModalParams, setEventLogModalParams] = useState<{
    user: TOnboardingUser;
    step: TOnboardingStep;
  } | null>(null);
  const [onboardingAdminListParams, setOnboardingAdminListParams] =
    useState<TOnboardingAdminParams>({
      offset: 0,
      limit: 25,
      query_string: undefined,
      showIncompleteOnly: false,
    });
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ['onboarding', 'adminList'],
    });
  }, [onboardingAdminListParams]);

  const { data, isError, isLoading } = useGetOnboardingAdminList(
    onboardingAdminListParams
  );
  if (isLoading) {
    return <Spinner />;
  }
  if (isError) {
    return (
      <div className={styles['root-placeholder']}>
        <Alert
          type="warning"
          message="Unable to access Onboarding administration"
        />
      </div>
    );
  }

  const { users, offset, limit, total } = data as TOnboardingAdminList;

  const toggleShowIncomplete = () => {
    setOnboardingAdminListParams({
      ...onboardingAdminListParams,
      showIncompleteOnly: !onboardingAdminListParams.showIncompleteOnly,
    });
  };

  // const paginationCallback = useCallback(
  //   (page: number) => {

  //     dispatch({
  //       type: 'FETCH_ONBOARDING_ADMIN_LIST',
  //       payload: {
  //         offset: (page - 1) * limit,
  //         limit,
  //         query,
  //         showIncompleteOnly,
  //       },
  //     });
  //   },
  //   [offset, limit, query, showIncompleteOnly]
  // );

  const viewLogCallback = useCallback(
    (user: TOnboardingUser, step: TOnboardingStep) => {
      setEventLogModalParams({ user, step });
    },
    [setEventLogModalParams]
  );

  const closeViewLogModal = useCallback(() => {
    setEventLogModalParams(null);
  }, [setEventLogModalParams]);

  const current = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);

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
                checked={onboardingAdminListParams.showIncompleteOnly}
                id="incompleteuser"
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
            <Alert type="warning" message="No users to show." />
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
            {/* <Paginator
              current={current}
              pages={pages}
              callback={paginationCallback}
              spread={5}
            /> */}
          </div>
        )}
        {eventLogModalParams && (
          <OnboardingEventLogModal
            params={eventLogModalParams}
            handleCancel={closeViewLogModal}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingAdmin;
