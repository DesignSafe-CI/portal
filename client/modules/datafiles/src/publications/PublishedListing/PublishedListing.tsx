import { TPublicationListingItem, usePublishedListing } from '@client/hooks';
import { Table, TableColumnsType } from 'antd';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const columns: TableColumnsType<TPublicationListingItem> = [
  {
    render: (_, record) => record.projectId,
    title: 'Project ID',
    width: '100px',
  },
  {
    render: (_, record) => <Link to={record.projectId}>{record.title}</Link>,
    title: 'Title',
    width: '50%',
  },
  {
    render: (_, record) => {
      return `${record.pi?.fname} ${record.pi?.lname}`;
    },
    title: 'Principal Investigator',
    ellipsis: true,
  },
  {
    title: 'Publication Date',
    ellipsis: true,
    render: (_, record) => new Date(record.created).toLocaleDateString(),
  },
];

export const PublishedListing: React.FC = () => {
  const limit = 100;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { data, isLoading } = usePublishedListing(currentPage, limit);

  return (
    <Table
      dataSource={data?.result ?? []}
      loading={isLoading}
      columns={columns}
      style={{ height: '100%' }}
      scroll={{ y: '100%', x: 500 }}
      rowKey={(row) => row.projectId}
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
