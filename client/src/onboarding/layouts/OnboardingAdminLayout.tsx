import React, { useState, useEffect } from 'react';
import { Alert, Layout, Checkbox, Table, TableColumnType, Space } from 'antd';
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
  data: TOnboardingAdminList;
  viewLogCallback: (user: TOnboardingUser, step: TOnboardingStep) => void;
}> = ({ data, viewLogCallback }) => {
  const [searchParams, setSearchParams] = useSearchParams();

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

  const { users, total, totalSteps } = data;

  let dataSource: TOnboardingAdminTableRowData[] = [];
  users.forEach((user) => {
    user.steps.forEach((step, index) => {
      return dataSource.push({ user, step, index });
    });
  });

  return (
    <Table
      dataSource={dataSource}
      size="small"
      columns={columns}
      bordered
      scroll={{ y: 800 }}
      pagination={{
        defaultPageSize: 20 * totalSteps, // 20 users with $totalSteps steps each
        defaultCurrent: 1,
        current: +(searchParams.get('page') as string) || undefined,
        hideOnSinglePage: true,
        showSizeChanger: false,
        total,
        onChange: (page, _) => {
          searchParams.set('page', page.toString());
          setSearchParams(searchParams);
        },
      }}
      sticky
    />
  );
};

const OnboardingAdminTable: React.FC<{
  data?: TOnboardingAdminList;
  isLoading: boolean;
  isError: boolean;
}> = ({ data, isLoading, isError }) => {
  const [eventLogModalParams, setEventLogModalParams] = useState<{
    user: TOnboardingUser;
    step: TOnboardingStep;
  } | null>(null);

  if (isLoading) {
    return <Spinner />;
  }
  if (isError || !data) {
    return (
      <div className={styles['root-placeholder']}>
        <Alert
          type="warning"
          message="Unable to access Onboarding administration"
        />
      </div>
    );
  }

  const viewLogCallback = (user: TOnboardingUser, step: TOnboardingStep) =>
    setEventLogModalParams({ user, step });

  const { users } = data;

  return (
    <>
      {users.length === 0 && (
        <div className={styles['no-users-placeholder']}>
          <Alert type="warning" message="No users to show." />
        </div>
      )}
      <div className={styles['user-container']}>
        {users.length > 0 && (
          <OnboardingAdminList data={data} viewLogCallback={viewLogCallback} />
        )}
      </div>
      {eventLogModalParams && (
        <OnboardingEventLogModal
          params={eventLogModalParams}
          handleCancel={() => setEventLogModalParams(null)}
        />
      )}
    </>
  );
};

const OnboardingAdminLayout = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isError, isLoading } = useGetOnboardingAdminList();
  useEffect(() => {}, [searchParams]);

  const toggleShowIncomplete = () => {
    const showIncompleteOnly = searchParams.get('showIncompleteOnly');
    const newSearchParams = searchParams;
    if (!showIncompleteOnly) {
      newSearchParams.set('showIncompleteOnly', 'true');
    } else {
      newSearchParams.delete('showIncompleteOnly');
      newSearchParams.delete('page');
    }

    setSearchParams(newSearchParams);
  };

  const { Header } = Layout;
  const headerStyle = {
    background: 'transparent',
    paddingLeft: 0,
    paddingRight: 0,
    borderBottom: '1px solid #707070',
    fontSize: 16,
  };
  return (
    <Layout style={{ overflowY: 'scroll', overflowX: 'hidden' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Header style={headerStyle}>Administrator Controls</Header>
        <div className={styles['search-checkbox-container']}>
          <OnboardingAdminSearchbar disabled={isLoading} />
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
              disabled={isLoading}
            />
            <span className={styles['label']}>Show Only Incomplete</span>
          </label>
        </div>
        <OnboardingAdminTable
          data={data}
          isLoading={isLoading}
          isError={isError}
        />
      </Space>
    </Layout>
  );
};

export default OnboardingAdminLayout;
