import React, { useMemo } from 'react';
import { Row, Flex, Button } from 'antd';
import { JobsListingTable, TJobsListingColumns } from '../../../workspace/src/JobsListing/JobsListingTable/JobsListingTable';
import { getStatusText, truncateMiddle } from '../../../workspace/src/utils';
import { formatDateTimeFromValue } from '../../../workspace/src/utils/timeFormat';
import styles from '../../../workspace/src/JobsListing/JobsListing.module.css';
import type { TTapisJob } from '@client/hooks';
import { JobActionButton } from '../../../workspace/src/JobsListing/JobsListing';
import { isTerminalState } from '../../../workspace/src/utils';

interface JobsListingWrapperProps {
  onViewDetails?: (uuid: string) => void;
}

export const JobsListingWrapper: React.FC<JobsListingWrapperProps> = ({ 
  onViewDetails 
}) => {
  const columns: TJobsListingColumns = useMemo(() => [
    {
      title: 'Job Name',
      dataIndex: 'name' as keyof TTapisJob,
      ellipsis: true,
      width: '30%',
      render: (_: any, job: TTapisJob) => (
        <Flex vertical>
          {truncateMiddle(job.name, 35)}
          <Row className={styles.jobActions}>
            {isTerminalState(job.status) && (
              <JobActionButton
                uuid={job.uuid}
                title="Relaunch"
                operation="resubmitJob"
                size="small"
              />
            )}
            {onViewDetails ? (
              <Button
                type="link"
                size="small"
                onClick={() => onViewDetails(job.uuid)}
                className={styles.link}
              >
                View Details
              </Button>
            ) : (
              <a href={`/dashboard/history/${job.uuid}`} className={styles.link}>
                View Details
              </a>
            )}
          </Row>
        </Flex>
      ),
    },
    {
      title: 'Application',
      dataIndex: 'appId' as keyof TTapisJob,
      width: '10%',
      render: (appId: string, job: TTapisJob) => {
        const appNotes = JSON.parse(job.notes);
        return appNotes.label || appId.charAt(0).toUpperCase() + appId.slice(1);
      },
    },
    {
      title: 'Job Status',
      dataIndex: 'status' as keyof TTapisJob,
      width: '10%',
      render: (status: string) => <>{getStatusText(status)}</>,
    },
    {
      title: 'Time Submitted - Finished',
      dataIndex: 'created' as keyof TTapisJob,
      width: '30%',
      render: (_: any, job: TTapisJob) => {
        const start = formatDateTimeFromValue(job.created);
        const end = formatDateTimeFromValue(job.ended);
        return (
          <div>
            {start} - {end}
          </div>
        );
      },
    },
  ], [onViewDetails]);

  const filterFn = (listing: TTapisJob[]) => {
    // Sort by created date (most recent first), then take top 4
    return [...listing]
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      .slice(0, 4);
  };

  return (
    <JobsListingTable
      columns={columns}
      pagination={false}
      size="small"
      filterFn={filterFn}
    />
  );
};