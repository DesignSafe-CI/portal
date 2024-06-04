import React, { useMemo, useState, useEffect } from 'react';
import { TableProps, Row, Flex } from 'antd';
import type { ButtonSize } from 'antd/es/button';
import { useQueryClient } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { PrimaryButton, SecondaryButton } from '@client/common-components';
import {
  useGetNotifications,
  TJobStatusNotification,
  usePostJobs,
  TJobPostOperations,
  useReadNotifications,
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

export const JobActionButton: React.FC<{
  uuid: string;
  operation: TJobPostOperations;
  title: string;
  type?: 'primary' | 'secondary';
  size?: ButtonSize;
}> = ({ uuid, operation, title, type, size, ...props }) => {
  const { mutate: mutateJob, isPending, isSuccess } = usePostJobs();
  const Button = type === 'primary' ? PrimaryButton : SecondaryButton;
  return (
    <Button
      size={size || 'middle'}
      onClick={() => mutateJob({ uuid, operation })}
      loading={isPending}
      disabled={isPending}
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
    event_types: ['interactive_session_ready'],
  });
  const { mutate: readNotifications } = useReadNotifications();

  // mark all as read on component mount
  useEffect(() => {
    readNotifications({
      event_types: ['interactive_session_ready', 'job'],
    });
  }, []);

  // update unread count state
  queryClient.setQueryData(
    [
      'workspace',
      'notifications',
      'badge',
      {
        event_types: ['interactive_session_ready', 'job'],
      },
    ],
    0
  );

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
                {isTerminalState(job.status) && (
                  <JobActionButton
                    uuid={job.uuid}
                    operation="resubmitJob"
                    title={isInteractiveJob(job) ? 'Resubmit' : 'Reuse Inputs'}
                    size="small"
                  />
                )}
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
          const formatDate = (dateString: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            const month = date.getMonth() + 1; // getMonth() is zero-indexed
            const day = date.getDate();
            const year = date.getFullYear();
            let hours = date.getHours();
            const minutes = date.getMinutes();
            // const amPm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            // Format the date and time parts to ensure two digits
            const formattedDate = `${month.toString().padStart(2, '0')}/${day
              .toString()
              .padStart(2, '0')}/${year}`;
            const formattedTime = `${hours
              .toString()
              .padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            return `${formattedDate} ${formattedTime}`;
          };

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
          const formattedStart = formatDate(job.created);
          const formattedEnd = formatDate(job.ended);
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
