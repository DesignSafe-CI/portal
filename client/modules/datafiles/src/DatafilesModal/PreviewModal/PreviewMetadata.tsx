import { Collapse, Table, TableProps } from 'antd';
import React from 'react';
import styles from './PreviewModal.module.css';
import { TFileListing, useFileDetail } from '@client/hooks';
import { toBytes } from '../../FileListing/FileListing';

const tableColumns: TableProps['columns'] = [
  { dataIndex: 'key', render: (value) => <strong>{value}</strong>, width: 200 },
  { dataIndex: 'value' },
];

export const PreviewMetadata: React.FC<{
  selectedFile: TFileListing;
  fileMeta: Record<string, string>;
}> = ({ selectedFile, fileMeta }) => {
  const { data: fileListingMeta } = useFileDetail(
    'tapis',
    selectedFile.system,
    'private',
    selectedFile.path
  );

  const baseListingMeta = [
    { key: 'File Name', value: fileListingMeta?.name },
    { key: 'File Path', value: fileListingMeta?.path },
    { key: 'File Size', value: toBytes(fileListingMeta?.length) },
    {
      key: 'Last Modified',
      value:
        fileListingMeta?.lastModified &&
        new Date(fileListingMeta.lastModified).toLocaleString(),
    },
  ];

  const fullListingMeta = [
    ...baseListingMeta,
    ...Object.keys(fileMeta).map((k) => ({ key: k, value: fileMeta[k] })),
  ];

  return (
    <Collapse
      className={styles.metadataCollapse}
      expandIconPosition="end"
      items={[
        {
          label: (
            <span style={{ fontStyle: 'italic', fontWeight: '600' }}>
              File Metadata
            </span>
          ),
          children: (
            <Table
              columns={tableColumns}
              dataSource={fullListingMeta}
              pagination={false}
            />
          ),
        },
      ]}
    />
  );
};
