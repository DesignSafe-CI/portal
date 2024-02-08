import { TProjectListingItem, useProjectListing } from '@client/hooks';
import { Table, TableColumnsType } from 'antd';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const columns: TableColumnsType<TProjectListingItem> = [
  {
    render: (_, record) => record.value.projectId,
    title: 'Project ID',
    width: '10%',
  },
  {
    render: (_, record) => (
      <Link to={record.value.projectId}>{record.value.title}</Link>
    ),
    title: 'Title',
    width: '50%',
  },
  {
    render: (_, record) => {
      const pi = record.value.users.find((u) => u.role === 'pi');
      return `${pi?.fname} ${pi?.lname}`;
    },
    title: 'Principal Investigator',
  },
  { render: (_, record) => record.lastUpdated, title: 'Last Modified' },
];

export const ProjectListing: React.FC = () => {
  const limit = 100;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { data, isLoading } = useProjectListing(currentPage, limit);

  return (
    <Table
      dataSource={data ? data.result : []}
      loading={isLoading}
      columns={columns}
      style={{ height: '100%' }}
      scroll={{ y: '100%' }}
      rowKey={(row) => row.uuid}
      pagination={{
        total: data?.total,
        showSizeChanger: false,
        current: currentPage,
        pageSize: 100,
        hideOnSinglePage: true,
        onChange: (page) => setCurrentPage(page),
      }}
    ></Table>
  );
};
