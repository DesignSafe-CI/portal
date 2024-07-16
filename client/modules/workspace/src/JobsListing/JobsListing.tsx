import React, { useMemo, useState, useEffect } from 'react';
import { TableProps, Row, Flex, Button as AntButton } from 'antd';
import type { ButtonSize } from 'antd/es/button';
import { useQueryClient } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { PrimaryButton, SecondaryButton } from '@client/common-components';
import { BaseButtonProps } from 'antd/es/button/button';
import {
  useGetNotifications,
  TJobStatusNotification,
  usePostJobs,
  TJobPostOperations,
  useReadNotifications,
  TGetNotificationsResponse,
} from '@client/hooks';
import {
  JobsListingTable,
  TJobsListingColumns,
} from './JobsListingTable/JobsListingTable';
import {
  getStatusText,
  truncateMiddle,
  getJobInteractiveSessionInfo,
  isOutputState,
  isInteractiveJob,
  isTerminalState,
} from '../utils';
import { InteractiveSessionModal } from '../InteractiveSessionModal';
import styles from './JobsListing.module.css';
import { formatDateTimeFromValue } from '../utils/timeFormat';
import { JobsReuseInputsButton } from '../JobsReuseInputsButton/JobsReuseInputsButton';

export const JobActionButton: React.FC<{
  uuid: string;
  operation: TJobPostOperations;
  title: string;
  type?: BaseButtonProps['type'];
  size?: ButtonSize;
  danger?: boolean;
}> = ({ uuid, operation, title, type, size, danger = false }) => {
  const { mutate: mutateJob, isPending, isSuccess } = usePostJobs();
  const Button =
    type === 'primary' ? (danger ? AntButton : PrimaryButton) : SecondaryButton;
  return (
    <Button
      size={size || 'middle'}
      onClick={() => mutateJob({ uuid, operation })}
      loading={isPending}
      disabled={isPending || isSuccess}
      danger={danger}
      type={type}
    >
      {title}
      {isSuccess && <i className="fa fa-check" style={{ marginLeft: 5 }} />}
    </Button>
  );
};

const InteractiveSessionButtons: React.FC<{
  uuid: string;
  interactiveSessionLink: string;
  message?: string;
}> = ({ uuid, interactiveSessionLink, message }) => {
  const [interactiveModalState, setInteractiveModalState] = useState(false);

  return (
    <>
      <SecondaryButton
        size="small"
        onClick={() => setInteractiveModalState(true)}
      >
        Open
      </SecondaryButton>
      <JobActionButton
        uuid={uuid}
        operation="cancelJob"
        title="End"
        size="small"
      />
      <InteractiveSessionModal
        isOpen={interactiveModalState}
        interactiveSessionLink={interactiveSessionLink}
        message={message}
        onCancel={() => setInteractiveModalState(false)}
      />
    </>
  );
};

export const JobsListing: React.FC<Omit<TableProps, 'columns'>> = ({
  ...tableProps
}) => {
  const queryClient = useQueryClient();
  const { data: interactiveSessionNotifs } = useGetNotifications({
    eventTypes: ['interactive_session_ready'],
    markRead: false,
  });
  const { mutate: readNotifications } = useReadNotifications();

  // mark all as read on component mount
  useEffect(() => {
    readNotifications({
      eventTypes: ['interactive_session_ready', 'job'],
    });

    // update unread count state
    queryClient.setQueryData(
      [
        'workspace',
        'notifications',
        {
          eventTypes: ['interactive_session_ready', 'job'],
          read: false,
          markRead: false,
        },
      ],
      (oldData: TGetNotificationsResponse) => {
        return {
          ...oldData,
          notifs: [],
          unread: 0,
        };
      }
    );
  }, []);

  const columns: TJobsListingColumns = useMemo(
    () => [
      {
        title: 'Job Name',
        dataIndex: 'name',
        ellipsis: true,
        width: '30%',
        render: (_, job) => {
          const { interactiveSessionLink, message } =
            getJobInteractiveSessionInfo(
              job,
              interactiveSessionNotifs?.notifs as TJobStatusNotification[]
            );

          return (
            <Flex vertical>
              {truncateMiddle(job.name, 35)}
              <Row className={styles.jobActions}>
                {!!interactiveSessionLink && (
                  <InteractiveSessionButtons
                    uuid={job.uuid}
                    interactiveSessionLink={interactiveSessionLink}
                    message={message}
                  />
                )}
                {!isInteractiveJob(job) && (
                  <SecondaryButton
                    size="small"
                    type="default"
                    href={`data/browser/tapis/${
                      job.archiveSystemId
                    }/${encodeURIComponent(job.archiveSystemDir)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={!isOutputState(job.status)}
                  >
                    {isOutputState(job.status)
                      ? 'View Output'
                      : 'Output Pending'}
                  </SecondaryButton>
                )}
                {isTerminalState(job.status) &&
                  (isInteractiveJob(job) ? (
                    <JobActionButton
                      uuid={job.uuid}
                      operation="resubmitJob"
                      title="Resubmit"
                      size="small"
                    />
                  ) : (
                    <JobsReuseInputsButton job={job} isSecondaryButton={true} />
                  ))}
                <NavLink to={job.uuid} className={styles.link}>
                  View Details
                </NavLink>
              </Row>
            </Flex>
          );
        },
      },
      {
        width: '10%',
        title: 'Application',
        dataIndex: 'appId',
        render: (appId, job) => {
          const appNotes = JSON.parse(job.notes);

          return (
            appNotes.label ||
            `${appId.charAt(0).toUpperCase()}${appId.slice(1)}`
          );
        },
      },
      {
        width: '10%',
        title: 'Job Status',
        dataIndex: 'status',
        render: (status) => <>{getStatusText(status)}</>,
      },
      { width: '10%', title: 'Nodes', dataIndex: 'nodeCount' },
      { width: '10%', title: 'Cores', dataIndex: 'coresPerNode' },
      {
        width: '30%',
        title: 'Time Submitted - Finished',
        dataIndex: 'created',
        render: (_, job) => {
          const formatDuration = (start: string, end: string) => {
            if (!start || !end) return '';
            const startDate = new Date(start).getTime();
            const endDate = new Date(end).getTime();
            const duration = endDate - startDate; // duration in milliseconds
            const seconds = Math.floor(duration / 1000);
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes
              .toString()
              .padStart(2, '0')}:${remainingSeconds
              .toString()
              .padStart(2, '0')}`;
          };
          const formattedStart = formatDateTimeFromValue(job.created);
          const formattedEnd = formatDateTimeFromValue(job.ended);
          const runtime = formatDuration(job.created, job.ended);

          return (
            <div>
              {formattedStart} - {formattedEnd}
              <br />
              Total Runtime:<b> {runtime} </b>
            </div>
          );
        },
      },
    ],
    [interactiveSessionNotifs]
  );

  return (
    <>
      <JobsListingTable columns={columns} {...tableProps} />
    </>
  );
};
