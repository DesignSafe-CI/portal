import React, { useState } from 'react';
import { Alert, Layout, Checkbox, Table, TableColumnType } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
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
        icon={<CheckOutlined />}
      >
        Approve
      </SecondaryButton>
      <SecondaryButton
        size="small"
        className={styles.approve}
        onClick={() => callback('staff_deny')}
        disabled={disabled}
        loading={action === 'staff_approve'}
        icon={<CloseOutlined />}
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

const OnboardingAdminList: React.FC<{
  users: TOnboardingUser[];
  viewLogCallback: (user: TOnboardingUser, step: TOnboardingStep) => void;
}> = ({ users, viewLogCallback }) => {
  const {
    mutate: sendOnboardingAction,
    isPending,
    variables,
  } = useSendOnboardingAction();
  const actionCallback = (
    step: string,
    username: string,
    action: TOnboardingAdminActions
  ) => {
    sendOnboardingAction({
      body: { action, step: step },
      username,
    });
  };

  type TOnboardingAdminTableRowData = {
    user: TOnboardingUser;
    step: TOnboardingStep;
    index: number;
  };

  const columns: TableColumnType<TOnboardingAdminTableRowData>[] = [
    {
      title: 'User',
      dataIndex: 'user',
      render: (user: TOnboardingUser) => (
        <>
          {`${user.firstName} ${user.lastName}`}
          <br />
          <span className={styles.username}>{user.username}</span>
        </>
      ),
      onCell: (record) => ({
        rowSpan: record.index === 0 ? record.user.steps.length : 0,
      }),
    },
    {
      title: 'Step',
      dataIndex: 'step',
      render: (step: TOnboardingStep) => (
        <span className={step.state === 'staffwait' ? styles.staffwait : ''}>
          {step.displayName}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'step',
      key: 'status',
      render: (step: TOnboardingStep) => (
        <span className={step.state === 'staffwait' ? styles.staffwait : ''}>
          <OnboardingStatus step={step} />
        </span>
      ),
    },
    {
      title: 'Administrative Actions',
      dataIndex: 'step',
      key: 'actions',
      render: (step: TOnboardingStep, record) => (
        <span className={step.state === 'staffwait' ? styles.staffwait : ''}>
          {step.state === 'staffwait' && (
            <OnboardingApproveActions
              callback={(action) =>
                actionCallback(step.step, record.user.username, action)
              }
              disabled={
                // Disable all admin actions while any action is being performed
                isPending
              }
              action={
                // If this user and step currently is running an admin action, pass down the action
                variables?.username === record.user.username &&
                variables.body.step === step.step
                  ? variables.body.action
                  : undefined
              }
            />
          )}

          <OnboardingResetLinks
            callback={(action) =>
              actionCallback(step.step, record.user.username, action)
            }
            disabled={isPending || step.state === 'completed'}
            action={
              variables?.username === record.user.username &&
              variables.body.step === step.step
                ? variables.body.action
                : undefined
            }
          />
        </span>
      ),
    },
    {
      title: 'Log',
      dataIndex: 'step',
      key: 'log',
      render: (step: TOnboardingStep, record) => (
        <span className={step.state === 'staffwait' ? styles.staffwait : ''}>
          <SecondaryButton
            type="link"
            className={styles['action-link']}
            onClick={() => viewLogCallback(record.user, step)}
          >
            View Log
          </SecondaryButton>
        </span>
      ),
    },
  ];

  let dataSource: TOnboardingAdminTableRowData[] = [];
  users.forEach((user) => {
    user.steps.forEach((step, index) => {
      return dataSource.push({ user, step, index });
    });
  });

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      bordered
      pagination={{
        defaultPageSize: 20,
        hideOnSinglePage: true,
        pageSizeOptions: ['10', '20', '50', '100'],
      }}
    />
  );
};

const OnboardingAdmin = () => {
  const [eventLogModalParams, setEventLogModalParams] = useState<{
    user: TOnboardingUser;
    step: TOnboardingStep;
  } | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [onboardingAdminListParams, setOnboardingAdminListParams] =
    useState<TOnboardingAdminParams>({
      offset: 0,
      limit: 10,
    });

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
    const showIncompleteOnly = searchParams.get('showIncompleteOnly');
    const newSearchParams = searchParams;
    if (!showIncompleteOnly) {
      newSearchParams.set('showIncompleteOnly', 'true');
    } else {
      newSearchParams.delete('showIncompleteOnly');
    }

    setSearchParams(newSearchParams);
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

  const viewLogCallback = (user: TOnboardingUser, step: TOnboardingStep) =>
    setEventLogModalParams({ user, step });

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
                checked={searchParams.get('showIncompleteOnly') === 'true'}
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
            handleCancel={() => setEventLogModalParams(null)}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingAdmin;
