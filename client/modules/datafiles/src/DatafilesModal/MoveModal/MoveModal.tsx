import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TModalChildren } from '../DatafilesModal';
import { Alert, Button, Modal, Table } from 'antd';
import {
  useCheckFilesForAssociation,
  useFileMove,
  usePathDisplayName,
  useSelectedFiles,
} from '@client/hooks';

import {
  BaseFileListingBreadcrumb,
  FileTypeIcon,
} from '@client/common-components';
import styles from './MoveModal.module.css';
import { toBytes } from '../../FileListing/FileListing';
import {
  FileListingTable,
  TFileListingColumns,
} from '@client/common-components';
import { useParams } from 'react-router-dom';

const SelectedFilesColumns: TFileListingColumns = [
  {
    title: 'Files/Folders to Move',
    dataIndex: 'name',
    render: (value, record) => (
      <span>
        <FileTypeIcon name={value} type={record.type} />
        &nbsp;&nbsp;{value}
      </span>
    ),
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
  projectId?: string;
}> = ({ api, system, path, projectId }) => {
  const getPathName = usePathDisplayName();
  return (
    <span style={{ fontWeight: 'normal' }}>
      <i role="none" className="fa fa-folder-o">
        &nbsp;&nbsp;
      </i>
      {projectId || getPathName(api, system, path)}
    </span>
  );
};

function getDestFilesColumns(
  api: string,
  system: string,
  path: string,
  mutationCallback: (path: string) => void,
  navCallback: (path: string) => void,
  projectId?: string,
  disabled?: boolean
): TFileListingColumns {
  return [
    {
      title: (
        <DestHeaderTitle
          api={api}
          system={system}
          path={path}
          projectId={projectId}
        />
      ),
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
          disabled={disabled}
        >
          Move
        </Button>
      ),
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() => mutationCallback(record.path)}
          disabled={disabled}
        >
          Move
        </Button>
      ),
    },
  ];
}

export const MoveModal: React.FC<{
  api: string;
  system: string;
  path: string;
  children: TModalChildren;
}> = ({ api, system, path, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  const { selectedFiles } = useSelectedFiles(api, system, path);

  let { projectId } = useParams();
  if (!projectId) projectId = '';

  const hasAssociations = useCheckFilesForAssociation(
    projectId,
    selectedFiles.map((f) => f.path)
  );

  const defaultDestParams = useMemo(
    () => ({
      destApi: api,
      destSystem: system,
      destPath: path,
      destProjectId: projectId,
    }),
    [api, system, path, projectId]
  );

  const [dest, setDest] = useState<{
    destApi: string;
    destSystem: string;
    destPath: string;
    destProjectId?: string;
  }>(defaultDestParams);
  const { destApi, destSystem, destPath } = dest;
  useEffect(() => setDest(defaultDestParams), [isModalOpen, defaultDestParams]);

  const navCallback = useCallback(
    (path: string) => {
      const newPath = path.split('/').slice(-1)[0];
      setDest({ ...dest, destPath: newPath });
    },
    [dest]
  );
  const { mutate } = useFileMove();

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
        navCallback,
        dest.destProjectId,
        hasAssociations
      ),
    [
      navCallback,
      destApi,
      destSystem,
      destPath,
      dest.destProjectId,
      mutateCallback,
      hasAssociations,
    ]
  );

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width="80%"
        title={<h2>Move Files</h2>}
        footer={null}
      >
        {hasAssociations && (
          <Alert
            type="warning"
            style={{ marginBottom: '10px' }}
            showIcon
            description={
              <span>
                This file or folder cannot be moved until its tags or associated
                entities have been removed using the Curation Directory tab.
              </span>
            }
          />
        )}
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
          <div className={styles.modalRightPanel}>
            <section className={styles.destFilesSection}>
              <BaseFileListingBreadcrumb
                api={destApi}
                system={destSystem}
                path={decodeURIComponent(destPath)}
                systemRootAlias={dest.destProjectId}
                initialBreadcrumbs={[]}
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
                  filterFn={(listing) =>
                    listing.filter(
                      (f) =>
                        f.type === 'dir' &&
                        !selectedFiles.map((sf) => sf.path).includes(f.path)
                    )
                  }
                  emptyListingDisplay="No folders to display."
                  scroll={undefined}
                />
              </div>
            </section>
          </div>
        </article>
      </Modal>
    </>
  );
};
