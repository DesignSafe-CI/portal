import { TBaseProject, useProjectListing } from '@client/hooks';
import { Button, Table, TableColumnsType } from 'antd';
import React, { useState } from 'react';

export const CopyModalProjectListing: React.FC<{
  onSelect: (uuid: string, projectId: string) => void;
}> = ({ onSelect }) => {
  const limit = 100;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { data, isLoading } = useProjectListing(currentPage, limit);

  const columns: TableColumnsType<TBaseProject> = [
    {
      render: (_, record) => record.value.projectId,
      title: 'Project ID',
    },
    {
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => onSelect(record.uuid, record.value.projectId)}
          style={{ whiteSpace: 'wrap', textAlign: 'start' }}
        >
          {record.value.title}
        </Button>
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
  ];

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
