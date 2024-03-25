import React, { useMemo, useState } from 'react';
import { Button, TableProps } from 'antd';
import {
  JobsListingTable,
  TJobsListingColumns,
} from './JobsListingTable/JobsListingTable';
import { getStatusText } from '../utils';
import { JobsDetailModalBody } from '../JobsDetailModal/JobsDetailModal';

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
        width: '50%',
        render: (data, record) => (
          <>
            {data}
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
          </>
        ),
      },
      {
        title: 'Application',
        dataIndex: 'appId',
      },
      {
        title: 'Job Status',
        dataIndex: 'status',
        render: (s) => getStatusText(s),
      },
      {
        title: 'Last Modified',
        dataIndex: 'lastUpdated',
        ellipsis: true,
        render: (d) => new Date(d).toLocaleString(),
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
