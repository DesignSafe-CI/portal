import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TModalChildren } from '../DatafilesModal';
import { Button, Modal, Table } from 'antd';
import {
  useAuthenticatedUser,
  useFileCopy,
  useSelectedFiles,
} from '@client/hooks';
import {
  FileListingTable,
  TFileListingColumns,
} from '../../FileListing/FileListingTable/FileListingTable';
import { BaseFileListingBreadcrumb } from '../../DatafilesBreadcrumb/DatafilesBreadcrumb';

const SelectedFilesColumns: TFileListingColumns = [
  {
    title: () => <span>Files to Copy</span>,
    dataIndex: 'name',
  },
];

function getDestFilesColumns(
  api: string,
  system: string,
  path: string,
  mutationCallback: (path: string) => void,
  navCallback: (path: string) => void
): TFileListingColumns {
  return [
    {
      title: () => (
        <BaseFileListingBreadcrumb
          style={{
            backgroundColor: 'transparent',
            fontWeight: 'normal',
            padding: '0px',
          }}
          api={api}
          system={system}
          path={path}
          separator={null}
          itemRender={(item, _, routes) =>
            item === routes.slice(-1)[0] && (
              <>
                <i
                  role="none"
                  style={{ color: '#333333' }}
                  className="fa fa-folder-o"
                >
                  &nbsp;&nbsp;
                </i>
                {item.title}
              </>
            )
          }
        />
      ),
      dataIndex: 'name',
      ellipsis: true,

      render: (data, record) =>
        record.type === 'dir' ? (
          <Button
            style={{ marginLeft: '3rem' }}
            onClick={() => navCallback(encodeURIComponent(record.path))}
            type="link"
          >
            <i
              role="none"
              style={{ color: '#333333' }}
              className="fa fa-folder-o"
            >
              &nbsp;&nbsp;
            </i>
            {data}
          </Button>
        ) : (
          data
        ),
    },
    {
      dataIndex: 'path',
      align: 'end',
      title: () => (
        <Button
          type="primary"
          onClick={() => mutationCallback(decodeURIComponent(path))}
        >
          Copy
        </Button>
      ),
      render: (data, record) => (
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
        title="Copy Files"
        footer={null}
      >
        <div
          style={{
            display: 'flex',
            maxHeight: '60vh',
            minHeight: '400px',
            gap: '50px',
          }}
        >
          <section style={{ flex: 1, overflow: 'auto' }}>
            <Table
              style={{ border: '1px solid gray', height: '100%' }}
              columns={SelectedFilesColumns}
              dataSource={selectedFiles}
              pagination={false}
              rowKey={(record) => record.path}
              scroll={{ y: undefined }}
            />
          </section>
          <section
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              overflow: 'auto',
              border: '1px solid gray',
            }}
          >
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
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
              }}
            >
              <FileListingTable
                style={{}}
                api={destApi}
                system={destSystem}
                path={destPath}
                columns={DestFilesColumns}
                rowSelection={undefined}
                filterFn={(listing) => listing.filter((f) => f.type === 'dir')}
                scroll={{ y: undefined }}
              ></FileListingTable>
            </div>
          </section>
        </div>
      </Modal>
    </>
  );
};
