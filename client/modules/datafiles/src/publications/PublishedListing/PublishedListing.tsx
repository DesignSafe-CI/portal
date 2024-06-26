import { TPublicationListingItem, usePublishedListing } from '@client/hooks';
import { Button, Modal, Table, TableColumnsType, Tag } from 'antd';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PublishedDescriptionModal: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button type="link" onClick={() => setIsOpen(true)}>
        View Description
      </Button>
      <Modal
        title={<h2>{title}</h2>}
        open={isOpen}
        width={900}
        onCancel={() => setIsOpen(false)}
        footer={
          <Button onClick={() => setIsOpen(false)} type="primary">
            Close
          </Button>
        }
      >
        <p>{description}</p>
      </Modal>
    </>
  );
};

const projectTypeMapping: Record<string, string> = {
  field_recon: 'Field research',
  other: 'Other',
  experimental: 'Experimental',
  simulation: 'Simulation',
  hybrid_simulation: 'Hybrid Simulation',
  field_reconnaissance: 'Field Reconaissance',
  None: 'None',
};

const columns: TableColumnsType<TPublicationListingItem> = [
  {
    render: (_, record) => record.projectId,
    title: 'Project ID',
    width: '100px',
  },
  {
    render: (_, record) => (
      <>
        <Link to={record.projectId}>{record.title}</Link>
        <br />
        {record.type !== 'other' && (
          <Tag color="#337ab7">{projectTypeMapping[record.type]}</Tag>
        )}
        {record.dataTypes.map((t) => (
          <Tag color="#337ab7" key={t}>
            {t}
          </Tag>
        ))}
      </>
    ),
    title: 'Title',
    width: '40%',
  },
  {
    render: (_, record) => {
      return `${record.pi?.fname} ${record.pi?.lname}`;
    },
    title: 'Principal Investigator',
  },
  {
    render: (_, record) => {
      return (
        <PublishedDescriptionModal
          title={record.title}
          description={record.description}
        />
      );
    },
    title: 'Description',
  },
  {
    render: (_, record) => {
      return <span>{`${record.keywords.join(', ')}`}</span>;
    },
    width: '15%',
    title: 'Keywords',
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
      scroll={{ y: '100%', x: 1000 }}
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
