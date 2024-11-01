import React from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Spin } from 'antd';
import { SecondaryButton } from '@client/common-components';
import {
  TOnboardingStep,
  useAuthenticatedUser,
  useSendOnboardingAction,
} from '@client/hooks';
import styles from './OnboardingActions.module.css';

const OnboardingActions = ({ step }: { step: TOnboardingStep }) => {
  const { user: authenticatedUser } = useAuthenticatedUser();
  const params = useParams();
  const {
    mutate: sendOnboardingAction,
    isPending,
    error,
  } = useSendOnboardingAction();

  // If the route loaded shows we are viewing a different user
  // (such as an admin viewing a user) then pull the username for
  // actions from the route. Otherwise, use the username of whomever is logged in
  const username = params.username || (authenticatedUser?.username as string);

  if (error) {
    return (
      <Alert
        type="warning"
        className="appDetail-error"
        message="We were unable to perform this action."
      />
    );
  }

  return (
    <>
      {isPending ? <Spin style={{ paddingLeft: 5 }} /> : null}
      <span className={styles.root} style={{ marginLeft: isPending ? 10 : 30 }}>
        {authenticatedUser?.isStaff && step.state === 'staffwait' ? (
          <span>
            <SecondaryButton
              type="link"
              className={styles.action}
              disabled={isPending}
              onClick={() =>
                sendOnboardingAction({
                  body: { action: 'staff_approve', step: step.step },
                  username,
                })
              }
            >
              {step.staffApprove}
            </SecondaryButton>
            &nbsp;&nbsp;&nbsp;
            <SecondaryButton
              type="link"
              className={styles.action}
              disabled={isPending}
              onClick={() =>
                sendOnboardingAction({
                  body: { action: 'staff_deny', step: step.step },
                  username,
                })
              }
            >
              {step.staffDeny}
            </SecondaryButton>
          </span>
        ) : null}
        {step.state === 'userwait' ? (
          step.data?.userlink ? (
            <SecondaryButton
              type="link"
              className={styles.action}
              href={step.data?.userlink?.url}
            >
              {step.data?.userlink?.text}
            </SecondaryButton>
          ) : (
            <SecondaryButton
              type="link"
              className={styles.action}
              disabled={isPending}
              onClick={() =>
                sendOnboardingAction({
                  body: { action: 'user_confirm', step: step.step },
                  username,
                })
              }
            >
              {step.userConfirm}
            </SecondaryButton>
          )
        ) : null}
        {authenticatedUser?.isStaff ? (
          <span>
            <SecondaryButton
              type="link"
              className={styles.action}
              disabled={isPending}
              onClick={() =>
                sendOnboardingAction({
                  body: { action: 'reset', step: step.step },
                  username,
                })
              }
            >
              Admin Reset
            </SecondaryButton>
            &nbsp;&nbsp;&nbsp;
            <SecondaryButton
              type="link"
              className={styles.action}
              disabled={isPending}
              onClick={() =>
                sendOnboardingAction({
                  body: { action: 'complete', step: step.step },
                  username,
                })
              }
            >
              Admin Skip
            </SecondaryButton>
          </span>
        ) : null}
      </span>
    </>
  );
};

export default OnboardingActions;
