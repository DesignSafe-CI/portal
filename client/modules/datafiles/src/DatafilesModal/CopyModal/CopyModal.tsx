import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TModalChildren } from '../DatafilesModal';
import { Button, Modal, Table } from 'antd';
import {
  useAuthenticatedUser,
  useFileCopy,
  usePathDisplayName,
  useSelectedFiles,
} from '@client/hooks';
import {
  FileListingTable,
  TFileListingColumns,
} from '../../FileListing/FileListingTable/FileListingTable';
import { BaseFileListingBreadcrumb } from '../../DatafilesBreadcrumb/DatafilesBreadcrumb';
import styles from './CopyModal.module.css';
import { toBytes } from '../../FileListing/FileListing';

const SelectedFilesColumns: TFileListingColumns = [
  {
    title: 'Files/Folders to Copy',
    dataIndex: 'name',
  },
  {
    title: <span />,
    dataIndex: 'length',
    render: (value) => toBytes(value),
  },
];

const DestHeaderTitle: React.FC<{
  api: string;
  system: string;
  path: string;
}> = ({ api, system, path }) => {
  const getPathName = usePathDisplayName();
  return (
    <span style={{ fontWeight: 'normal' }}>
      <i role="none" className="fa fa-folder-o">
        &nbsp;&nbsp;
      </i>
      {getPathName(api, system, path)}
    </span>
  );
};

function getDestFilesColumns(
  api: string,
  system: string,
  path: string,
  mutationCallback: (path: string) => void,
  navCallback: (path: string) => void
): TFileListingColumns {
  return [
    {
      title: <DestHeaderTitle api={api} system={system} path={path} />,
      dataIndex: 'name',
      ellipsis: true,

      render: (data, record) => (
        <Button
          style={{ marginLeft: '3rem', textAlign: 'center' }}
          onClick={() => navCallback(encodeURIComponent(record.path))}
          type="link"
        >
          <i
            role="none"
            style={{ color: '#333333' }}
            className="fa fa-folder-o"
          />
          &nbsp;&nbsp;
          {data}
        </Button>
      ),
    },
    {
      dataIndex: 'path',
      align: 'end',
      title: (
        <Button
          type="primary"
          onClick={() => mutationCallback(decodeURIComponent(path))}
        >
          Copy
        </Button>
      ),
      render: (_, record) => (
        <Button type="primary" onClick={() => mutationCallback(record.path)}>
          Copy
        </Button>
      ),
    },
  ];
}

export const CopyModal: React.FC<{
  api: string;
  system: string;
  path: string;
  children: TModalChildren;
}> = ({ api, system, path, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  const { selectedFiles } = useSelectedFiles(api, system, path);
  const { user } = useAuthenticatedUser();

  const defaultDestParams = useMemo(
    () => ({
      destApi: 'tapis',
      destSystem: 'designsafe.storage.default',
      destPath: encodeURIComponent('/' + user?.username),
    }),
    [user]
  );

  const [dest, setDest] = useState(defaultDestParams);
  const { destApi, destSystem, destPath } = dest;
  useEffect(() => setDest(defaultDestParams), [isModalOpen, defaultDestParams]);

  const navCallback = useCallback(
    (path: string) => {
      const newPath = path.split('/').slice(-1)[0];
      setDest({ ...dest, destPath: newPath });
    },
    [dest]
  );
  const { mutate } = useFileCopy();

  const mutateCallback = useCallback(
    (dPath: string) => {
      selectedFiles.forEach((f) =>
        mutate({
          src: { api, system, path: encodeURIComponent(f.path) },
          dest: { api: destApi, system: destSystem, path: dPath },
        })
      );
      handleClose();
    },
    [selectedFiles, mutate, destApi, destSystem, api, system]
  );

  const DestFilesColumns = useMemo(
    () =>
      getDestFilesColumns(
        destApi,
        destSystem,
        destPath,
        (dPath: string) => mutateCallback(dPath),
        navCallback
      ),
    [navCallback, destApi, destSystem, destPath, mutateCallback]
  );

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width="80%"
        title={<h2>Copy Files</h2>}
        footer={null}
      >
        <article className={styles.copyModalContent}>
          <section className={styles.srcFilesSection}>
            <Table
              className={styles.srcFilesTable}
              columns={SelectedFilesColumns}
              dataSource={selectedFiles}
              pagination={false}
              rowKey={(record) => record.path}
              scroll={{ y: '100%' }}
            />
          </section>
          <section className={styles.destFilesSection}>
            <BaseFileListingBreadcrumb
              api={destApi}
              system={destSystem}
              path={destPath}
              itemRender={(item) => {
                return (
                  <Button
                    type="link"
                    onClick={() => navCallback(item.path ?? '')}
                  >
                    {item.title}
                  </Button>
                );
              }}
            />
            <div className={styles.destFilesTableContainer}>
              <FileListingTable
                api={destApi}
                system={destSystem}
                path={destPath}
                columns={DestFilesColumns}
                rowSelection={undefined}
                filterFn={(listing) => listing.filter((f) => f.type === 'dir')}
                scroll={undefined}
              />
            </div>
          </section>
        </article>
      </Modal>
    </>
  );
};
