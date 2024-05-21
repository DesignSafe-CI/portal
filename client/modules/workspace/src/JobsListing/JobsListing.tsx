import React, { useMemo, useState } from 'react';
import { TableProps, Row, Flex } from 'antd';
import { SecondaryButton } from '@client/common-components';
import {
  useGetNotifications,
  TJobStatusNotification,
  TNotificationsResponse,
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
import { JobsDetailModalBody } from '../JobsDetailModal/JobsDetailModal';
import { InteractiveSessionModal } from '../InteractiveSessionModal';
import styles from './JobsListing.module.css';

export const JobsListing: React.FC<Omit<TableProps, 'columns'>> = ({
  ...tableProps
}) => {
  const [jobDetailModalState, setJobDetailModalState] = useState<{
    isOpen: boolean;
    uuid?: string;
  }>({ isOpen: false });

  const [interactiveModalState, setInteractiveModalState] = useState(false);
  const { data } = useGetNotifications({
    event_type: 'interactive_session_ready',
  }) as { data: TNotificationsResponse };
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
              data?.notifs as TJobStatusNotification[]
            );

          return (
            <Flex vertical>
              {truncateMiddle(job.name, 35)}
              <Row className={styles.jobActions}>
                {interactiveSessionLink && (
                  <>
                    <SecondaryButton
                      onClick={() =>
                        setInteractiveModalState(!interactiveModalState)
                      }
                    >
                      Open
                    </SecondaryButton>
                    {/* TODOv3: hook up job cancel */}
                    <SecondaryButton onClick={() => console.log('cancel job')}>
                      End
                    </SecondaryButton>
                    <InteractiveSessionModal
                      isOpen={interactiveModalState}
                      interactiveSessionLink={interactiveSessionLink}
                      message={message}
                      onCancel={() =>
                        setInteractiveModalState(!interactiveModalState)
                      }
                    />
                  </>
                )}
                {!isInteractiveJob(job) && (
                  <SecondaryButton
                    type="default"
                    href={`data/browser/${job.archiveSystemId}${job.archiveSystemDir}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    disabled={!isOutputState(job.status)}
                  >
                    {isOutputState(job.status)
                      ? 'View Output'
                      : 'Output Pending'}
                  </SecondaryButton>
                )}
                {/* TODOv3: hook up job cancel */}
                {isTerminalState(job.status) && (
                  <SecondaryButton onClick={() => console.log('resubmit')}>
                    {isInteractiveJob(job) ? 'Resubmit' : 'Reuse Inputs'}
                  </SecondaryButton>
                )}
                {/* TODOv3: hook up job cancel */}
                <SecondaryButton
                  type="link"
                  onClick={() =>
                    setJobDetailModalState({ isOpen: true, uuid: job.uuid })
                  }
                >
                  View Details
                </SecondaryButton>
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
    [setJobDetailModalState]
  );

  return (
    <>
      <JobsListingTable columns={columns} {...tableProps} />
      {jobDetailModalState.uuid && (
        <JobsDetailModalBody
          isOpen={jobDetailModalState.isOpen}
          uuid={jobDetailModalState.uuid}
        />
      )}
    </>
  );
};
