import React, { useMemo, useState } from 'react';
//import styles from './FileListing.module.css';
import { Button, TableProps, Tag } from 'antd';
import {
  FileListingTable,
  TFileListingColumns,
} from '@client/common-components';
import { NavLink } from 'react-router-dom';
import { PreviewModalBody } from '../DatafilesModal/PreviewModal';
import { TFileTag } from '@client/hooks';

export function toBytes(bytes?: number) {
  if (bytes === 0) return '0 bytes';
  if (!bytes) return '-';
  const units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
  const orderOfMagnitude = Math.floor(Math.log(bytes) / Math.log(1024));
  const precision = orderOfMagnitude === 0 ? 0 : 1;
  const bytesInUnits = bytes / Math.pow(1024, orderOfMagnitude);
  return `${bytesInUnits.toFixed(precision)} ${units[orderOfMagnitude]}`;
}

export const FileListing: React.FC<
  {
    api: string;
    system: string;
    path?: string;
    scheme?: string;
    baseRoute?: string;
    fileTags?: TFileTag[];
  } & Omit<TableProps, 'columns'>
> = ({
  api,
  system,
  path = '',
  scheme = 'private',
  baseRoute,
  fileTags,
  ...tableProps
}) => {
  // Base file listing for use with My Data/Community Data
  const [previewModalState, setPreviewModalState] = useState<{
    isOpen: boolean;
    path?: string;
  }>({ isOpen: false });

  const columns: TFileListingColumns = useMemo(
    () => [
      {
        title: 'File Name',
        dataIndex: 'name',
        ellipsis: true,
        width: '50%',
        render: (data, record) => (
          <>
            {record.type === 'dir' ? (
              <NavLink
                className="listing-nav-link"
                to={`${baseRoute ?? '..'}/${encodeURIComponent(record.path)}`}
                replace={false}
              >
                <i
                  role="none"
                  style={{ color: '#333333' }}
                  className="fa fa-folder"
                >
                  &nbsp;&nbsp;
                </i>
                {data}
              </NavLink>
            ) : (
              <Button
                type="link"
                style={{ userSelect: 'text' }}
                onClick={() =>
                  setPreviewModalState({ isOpen: true, path: record.path })
                }
              >
                <i
                  role="none"
                  style={{ color: '#333333' }}
                  className="fa fa-file-o"
                >
                  &nbsp;&nbsp;
                </i>
                {data}
              </Button>
            )}
            <br />
            {(fileTags ?? [])
              .filter((tag) => tag.path === record.path)
              .map((tag) => (
                <Tag color="#337ab7" key={tag.tagName}>
                  {tag.tagName}
                </Tag>
              ))}
          </>
        ),
      },
      {
        title: 'Size',
        dataIndex: 'length',
        render: (d) => toBytes(d),
      },
      {
        title: 'Last Modified',
        dataIndex: 'lastModified',
        ellipsis: true,
        render: (d) => new Date(d).toLocaleString(),
      },
    ],
    [setPreviewModalState, baseRoute]
  );

  return (
    <>
      <FileListingTable
        api={api}
        system={system}
        scheme={scheme}
        path={path}
        columns={columns}
        {...tableProps}
      />
      {previewModalState.path && (
        <PreviewModalBody
          isOpen={previewModalState.isOpen}
          api={api}
          system={system}
          path={previewModalState.path}
          handleCancel={() => setPreviewModalState({ isOpen: false })}
        />
      )}
    </>
  );
};
