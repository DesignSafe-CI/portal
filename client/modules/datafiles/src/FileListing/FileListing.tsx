import React, { useMemo } from 'react';
//import styles from './FileListing.module.css';
import { Button } from 'antd';
import {
  FileListingTable,
  TFileListingColumns,
} from './FileListingTable/FileListingTable';
import { NavLink } from 'react-router-dom';
import DatafilesModal from '../DatafilesModal/DatafilesModal';

function toBytes(bytes?: number) {
  if (bytes === 0) return '0 bytes';
  if (!bytes) return '-';
  const units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
  const orderOfMagnitude = Math.floor(Math.log(bytes) / Math.log(1024));
  const precision = orderOfMagnitude === 0 ? 0 : 1;
  const bytesInUnits = bytes / Math.pow(1024, orderOfMagnitude);
  return `${bytesInUnits.toFixed(precision)} ${units[orderOfMagnitude]}`;
}

export const FileListing: React.FC<{
  api: string;
  system?: string;
  path?: string;
  scheme?: string;
}> = ({ api, system, path = '', scheme = 'private' }) => {
  // Base file listing for use with My Data/Community Data
  const columns: TFileListingColumns = useMemo(
    () => [
      {
        title: 'File Name',
        dataIndex: 'name',
        ellipsis: true,
        width: '50%',
        shouldCellUpdate: () => false,
        render: (data, record) =>
          record.type === 'dir' ? (
            <NavLink
              to={`../${encodeURIComponent(record.path)}`}
              replace={false}
            >
              {data}
            </NavLink>
          ) : (
            <DatafilesModal.Preview
              api={api}
              system={record.system}
              path={record.path}
              scheme={scheme}
            >
              <Button type="link">{data}</Button>
            </DatafilesModal.Preview>
          ),
      },
      {
        title: 'Size',
        dataIndex: 'length',
        render: (d) => toBytes(d),
        shouldCellUpdate: () => false,
      },
      {
        title: 'Last Modified',
        dataIndex: 'lastModified',
        ellipsis: true,
        render: (d) => new Date(d).toLocaleString(),
        shouldCellUpdate: () => false,
      },
    ],
    [api, scheme]
  );

  return (
    <FileListingTable
      api={api}
      system={system}
      scheme={scheme}
      path={path}
      columns={columns}
    />
  );
};
