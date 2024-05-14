import React, { useMemo, useState } from 'react';
import { Button, TableProps } from 'antd';
import {
  JobsListingTable,
  TJobsListingColumns,
} from './JobsListingTable/JobsListingTable';
import { getStatusText } from '../utils/jobs';
import { JobsDetailModalBody } from '../JobsDetailModal/JobsDetailModal';
import { TJob } from '@client/hooks';
import { uuid } from 'uuidv4';

export const JobsListing: React.FC<Omit<TableProps, 'columns'>> = ({
  ...tableProps
}) => {
  const [jobDetailModalState, setJobDetailModalState] = useState<{
    isOpen: boolean;
    uuid?: string;
  }>({ isOpen: false });

  const columns: TJobsListingColumns = useMemo(
    () => [
      {
        title: 'Job Name',
        dataIndex: 'name',
        ellipsis: true,
        width: '30%',
        render: (data, record) => (
          <div>
            {record.name}
            <br />
            <Button type="default">
              View Output
            </Button>
            <Button
              type="link"
              onClick={() =>
                setJobDetailModalState({ isOpen: true, uuid: record.uuid })
              }
            >
              <i
                role="none"
                style={{ color: '#333333' }}
                className="fa fa-file-o"
              >
                &nbsp;&nbsp;
              </i>
              View Details
            </Button>
          </div>
        ),
      },
      { width: '10%',
        title: 'Application',
        dataIndex: 'appId',
        render: (appId) => {
          // Check if appId is not null or undefined
          if (appId) {
            // Capitalize the first letter and concatenate the rest of the string
            return `${appId.charAt(0).toUpperCase()}${appId.slice(1)}`;
          }
          return ''; // Return an empty string or a default value if appId is undefined or null
        },
      },
      { width: '10%',
        title: 'Job Status',
        dataIndex: 'status',
      },
      { width: '10%',
        title: 'Nodes',
        dataIndex: 'nodeCount',
      },
      { width: '10%',
        title: 'Cores',
        dataIndex: 'coresPerNode',
      },
      { width: '30%',
        title: 'Time Submitted - Finished',
        dataIndex: 'created',
        render: (text, record) => {
          const formatDate = (dateString: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            const month = date.getMonth() + 1;  // getMonth() is zero-indexed
            const day = date.getDate();
            const year = date.getFullYear();
            let hours = date.getHours();
            const minutes = date.getMinutes();
            const amPm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            // Format the date and time parts to ensure two digits
            const formattedDate = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
            const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            return `${formattedDate} ${formattedTime}`;
          };

          const formatDuration = (start: string, end: string) => {
            if (!start || !end) return '';
            const startDate = new Date(start).getTime();
            const endDate = new Date(end).getTime();
            const duration = endDate - startDate;  // duration in milliseconds
            const seconds = Math.floor(duration / 1000);
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const remainingSeconds = seconds % 60;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
          };
          const formattedStart = formatDate(record.created);
          const formattedEnd = formatDate(record.ended);
          const runtime = formatDuration(record.created, record.ended);

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
