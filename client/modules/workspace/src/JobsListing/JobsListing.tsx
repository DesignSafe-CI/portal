import React, { useMemo, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { TableProps, Tag, Row, Flex, Button as AntButton } from 'antd';
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
  useInteractiveModalContext,
  TInteractiveModalContext,
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
import styles from './JobsListing.module.css';
import { formatDateTimeFromValue } from '../utils/timeFormat';
import { CustomStatusBadge } from '../../../datafiles/src/projects/forms/_common';
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
  interactiveSessionLink?: string;
  message?: string;
}> = ({ uuid, interactiveSessionLink, message }) => {
  const [, setInteractiveModalDetails] =
    useInteractiveModalContext() as TInteractiveModalContext;

  return (
    <>
      <SecondaryButton
        size="small"
        onClick={() =>
          setInteractiveModalDetails({
            show: true,
            interactiveSessionLink,
            message,
            uuid: uuid,
          })
        }
      >
        Open
      </SecondaryButton>
      <JobActionButton
        uuid={uuid}
        operation="cancelJob"
        title="End"
        size="small"
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
  const { sendMessage } = useWebSocket(
    `wss://${window.location.host}/ws/websockets/`
  );

  // mark all as read on component mount
  useEffect(() => {
    readNotifications({
      eventTypes: ['interactive_session_ready', 'job'],
    });
    sendMessage('markAllNotificationsAsRead');

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
                      title="Relaunch"
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
        title: 'Job Status',
        dataIndex: 'status',

        render: (status) => {
          const text = getStatusText(status);
          if (status === 'FINISHED') {
            return <CustomStatusBadge type="green">{text}</CustomStatusBadge>;
          }
          if (status === 'FAILURE') {
            return <CustomStatusBadge type="red">{text}</CustomStatusBadge>;
          }
          return <CustomStatusBadge type="yellow">{text}</CustomStatusBadge>;
        },
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

  return <JobsListingTable columns={columns} {...tableProps} />;
};
