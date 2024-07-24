import React, { useMemo, useState } from 'react';
//import styles from './FileListing.module.css';
import { Button, TableProps, Tag } from 'antd';
import {
  FileListingTable,
  FileTypeIcon,
  TFileListingColumns,
} from '@client/common-components';
import { NavLink } from 'react-router-dom';
import { PreviewModalBody } from '../DatafilesModal/PreviewModal';
import { TFileListing, TFileTag, useDoiContext } from '@client/hooks';

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
    emptyListingDisplay?: React.ReactNode;
  } & Omit<TableProps, 'columns'>
> = ({
  api,
  system,
  path = '',
  scheme = 'private',
  baseRoute,
  fileTags,
  emptyListingDisplay,
  ...tableProps
}) => {
  // Base file listing for use with My Data/Community Data
  const [previewModalState, setPreviewModalState] = useState<{
    isOpen: boolean;
    path?: string;
    selectedFile?: TFileListing;
  }>({ isOpen: false });

  const doi = useDoiContext();
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
                to={`${baseRoute ?? '..'}/${encodeURIComponent(record.path)}${
                  doi ? `?doi=${doi}` : ''
                }`}
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
              <>
                <FileTypeIcon name={record.name} />
                &nbsp;&nbsp;
                <Button
                  type="link"
                  style={{ userSelect: 'text' }}
                  onClick={() =>
                    setPreviewModalState({
                      isOpen: true,
                      path: record.path,
                      selectedFile: { ...record, doi },
                    })
                  }
                >
                  {data}
                </Button>
              </>
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
    [setPreviewModalState, baseRoute, fileTags, doi]
  );

  return (
    <>
      <FileListingTable
        api={api}
        system={system}
        scheme={scheme}
        path={path}
        columns={columns}
        emptyListingDisplay={emptyListingDisplay}
        {...tableProps}
      />
      {previewModalState.path && previewModalState.selectedFile && (
        <PreviewModalBody
          scheme={scheme}
          selectedFile={previewModalState.selectedFile}
          isOpen={previewModalState.isOpen}
          api={api}
          handleCancel={() => setPreviewModalState({ isOpen: false })}
        />
      )}
    </>
  );
};
