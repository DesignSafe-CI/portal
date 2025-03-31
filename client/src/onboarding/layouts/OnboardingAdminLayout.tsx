import React, { useState, useEffect } from 'react';
import {
  Alert,
  Layout,
  Checkbox,
  Table,
  TableColumnType,
  Dropdown,
  Space,
  Typography,
  Flex,
} from 'antd';
import type { MenuProps } from 'antd';
import { CheckOutlined, CloseOutlined, DownOutlined } from '@ant-design/icons';
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
  useSendOnboardingAction,
  useGetOnboardingAdminList,
  TOnboardingAdminList,
} from '@client/hooks';

const OnboardingApproveActions: React.FC<{
  step: TOnboardingStep;
  username: string;
}> = ({ step, username }) => {
  const {
    mutate: sendOnboardingAction,
    isPending,
    variables,
  } = useSendOnboardingAction();

  return (
    <div className={styles['approve-container']}>
      <SecondaryButton
        size="small"
        className={styles.approve}
        onClick={() =>
          sendOnboardingAction({
            body: { action: 'staff_approve', step: step.step },
            username,
          })
        }
        loading={isPending && variables?.body.action === 'staff_approve'}
        disabled={isPending && variables?.body.action === 'staff_deny'}
        icon={<CheckOutlined />}
      >
        Approve
      </SecondaryButton>
      <SecondaryButton
        size="small"
        className={styles.approve}
        onClick={() =>
          sendOnboardingAction({
            body: { action: 'staff_deny', step: step.step },
            username,
          })
        }
        loading={isPending && variables?.body.action === 'staff_deny'}
        disabled={isPending && variables?.body.action === 'staff_approve'}
        icon={<CloseOutlined />}
      >
        Deny
      </SecondaryButton>
    </div>
  );
};

const OnboardingResetLinks: React.FC<{
  step: TOnboardingStep;
  username: string;
}> = ({ step, username }) => {
  const {
    mutate: sendOnboardingAction,
    isPending,
    variables,
  } = useSendOnboardingAction();

  return (
    <div className={styles.reset}>
      <SecondaryButton
        type="link"
        className={styles['action-link']}
        onClick={() =>
          sendOnboardingAction({
            body: { action: 'reset', step: step.step },
            username,
          })
        }
        loading={isPending && variables?.body.action === 'reset'}
      >
        Reset
      </SecondaryButton>
      |
      <SecondaryButton
        type="link"
        className={styles['action-link']}
        disabled={step.state === 'completed'}
        onClick={() =>
          sendOnboardingAction({
            body: { action: 'complete', step: step.step },
            username,
          })
        }
        loading={isPending && variables?.body.action === 'complete'}
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

  type TOnboardingAdminTableRowData = {
    user: TOnboardingUser;
    step: TOnboardingStep;
    index: number;
  };

  const columns: TableColumnType<TOnboardingAdminTableRowData>[] = [
    {
      title: 'User',
      dataIndex: 'user',
      className: styles.highlightCell,
      render: (user: TOnboardingUser, record) => (
        <span
          className={record.step.state === 'staffwait' ? styles.staffwait : ''}
        >
          {`${user.firstName} ${user.lastName}`}
          <br />
          <span className={styles.username}>{user.username}</span>
        </span>
      ),
      onCell: (record) => ({
        rowSpan: record.index === 0 ? record.user.steps.length : 0,
      }),
    },
    {
      title: 'Step',
      dataIndex: 'step',
      className: styles.highlightCell,
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
      className: styles.highlightCell,
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
      className: styles.highlightCell,
      render: (step: TOnboardingStep, record) => (
        <Flex
          justify="space-between"
          className={step.state === 'staffwait' ? styles.staffwait : ''}
          align="center"
        >
          <OnboardingResetLinks username={record.user.username} step={step} />
          {step.state === 'staffwait' && (
            <OnboardingApproveActions
              username={record.user.username}
              step={step}
            />
          )}
        </Flex>
      ),
    },
    {
      title: 'Log',
      dataIndex: 'step',
      key: 'log',
      className: styles.highlightCell,
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

  const dataSource: TOnboardingAdminTableRowData[] = [];
  users.forEach((user) => {
    user.steps.forEach((step, index) => {
      return dataSource.push({ user, step, index });
    });
  });

  return (
    <>
      <Space style={{ marginBottom: 16 }}></Space>
      <Table
        dataSource={dataSource}
        size="small"
        columns={columns}
        bordered
        scroll={{ y: '60vh' }}
        pagination={{
          defaultPageSize: 20 * totalSteps, // 20 users with $totalSteps steps each
          defaultCurrent: 1,
          current: +(searchParams.get('page') as string) || undefined,
          hideOnSinglePage: false,
          showSizeChanger: false,
          total: total * 20 * totalSteps, // total elements = total users * 20 users per page * total steps
          onChange: (page, _) => {
            searchParams.set('page', page.toString());
            setSearchParams(searchParams);
          },
        }}
        sticky
      />
    </>
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

  // Update modal step data if the user is updated
  useEffect(() => {
    if (eventLogModalParams?.user && data) {
      setEventLogModalParams({
        user: eventLogModalParams.user,
        step:
          data.users
            .find((user) => user.username === eventLogModalParams.user.username)
            ?.steps.find(
              (step) => step.step === eventLogModalParams.step.step
            ) || eventLogModalParams.step,
      });
    }
  }, [data]);

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

  const setOrderBy = (orderBy: string) => {
    searchParams.set('orderBy', orderBy);
    setSearchParams(searchParams);
  };

  const orderByItems: MenuProps['items'] = [
    {
      key: 'default',
      label: 'Default (Date Joined, Incomplete, Last Name, First Name)',
    },
    {
      key: 'last_name',
      label: 'Last Name (A-Z)',
    },
    {
      key: 'first_name',
      label: 'First Name (A-Z)',
    },
    {
      key: '-date_joined',
      label: 'Date Joined (Newest First)',
    },
    {
      key: 'profile__setup_complete',
      label: 'Setup Complete (Incomplete First)',
    },
  ];

  return (
    <Layout style={{ overflowY: 'scroll', overflowX: 'hidden' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Header style={headerStyle}>Administrator Controls</Header>
        <div className={styles['search-checkbox-container']}>
          <OnboardingAdminSearchbar disabled={isLoading} />
          <Flex>
            <Dropdown
              menu={{
                items: orderByItems,
                selectable: true,
                defaultSelectedKeys: [searchParams.get('orderBy') || 'default'],
                onSelect: ({ key }) => setOrderBy(key),
              }}
            >
              <Typography.Link>
                <Space>
                  Order By
                  <DownOutlined />
                </Space>
              </Typography.Link>
            </Dropdown>
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
          </Flex>
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
