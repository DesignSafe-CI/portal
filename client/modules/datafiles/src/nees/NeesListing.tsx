import { TNeesListingItem, useNeesListing } from '@client/hooks';
import { Table, TableColumnsType, Button, Modal } from 'antd';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const NeesListing: React.FC = () => {
  const limit = 100;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { data, isLoading } = useNeesListing(currentPage, limit);

  const [open, setOpen] = useState(false);
  const [modaldata, setmodaldata] = useState<string>('');
  const showModal = (description: string) => {
    setmodaldata(description);
    setOpen(true);
  };

  const columns: TableColumnsType<TNeesListingItem> = [
    {
      render: (_, record) => <Link to={record.path}>{record.title}</Link>,
      title: 'Project Title',
      width: '40%',
    },
    {
      render: (_, record) =>
        record.pis
          ? `${record.pis[0].firstName} ${record.pis[0].lastName}`
          : '(N/A)',
      title: 'Project PI',
    },
    {
      render: (_, record) => {
        return (
          <Button type="primary" onClick={() => showModal(record.description)}>
            View Description
          </Button>
        );
      },
      title: 'Project Description',
    },
    {
      render: (_, record) => {
        const date = record.startDate.split('T');
        return date[0];
      },
      title: 'Start Date',
    },
  ];

  return (
    <>
      <Table
        dataSource={data ? data.listing : []}
        loading={isLoading}
        columns={columns}
        style={{ height: '100%' }}
        scroll={{ y: '100%' }}
        rowKey={(row) => row.path}
        pagination={{
          total: data?.listing.length,
          showSizeChanger: false,
          current: currentPage,
          pageSize: 100,
          hideOnSinglePage: true,
          onChange: (page) => setCurrentPage(page),
        }}
      ></Table>
      <Modal
        title="Description"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        width={1000}
      >
        <p>{modaldata}</p>
      </Modal>
    </>
  );
};
