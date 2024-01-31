import React, { useState } from 'react';
import { TModalChildren } from '../DatafilesModal';
import { Button, Modal, Table } from 'antd';
import { useAuthenticatedUser, useSelectedFiles } from '@client/hooks';
import {
  FileListingTable,
  TFileListingColumns,
} from '../../FileListing/FileListingTable/FileListingTable';
import { DatafilesBreadcrumb } from '../../DatafilesBreadcrumb/DatafilesBreadcrumb';

const SelectedFilesColumns: TFileListingColumns = [
  {
    title: () => <span style={{ fontWeight: 'normal' }}>hii</span>,
    dataIndex: 'name',
  },
];

function getBaseRouteName(api: string, system: string): string {
  if (api === 'googledrive') return 'Google Drive';
  if (api === 'box') return 'Box';
  if (api === 'dropbox') return 'Dropbox';
  return (
    {
      'designsafe.storage.default': 'My Data',
      'designsafe.storage.frontera.work': 'My Data (Work)',
      'designsafe.storage.community': 'Community Data',
    }[system] ?? 'Data Files'
  );
}
function getInitialBreadcrumbs(api: string, system: string, username: string) {
  return [
    {
      path: '',
      title: getBaseRouteName(api, system),
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
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const onOk = () => {
    //Placeholder for file copy logic
  };

  const isUserHomeSystem = [
    'designsafe.storage.default',
    'designsafe.storage.frontera.work',
  ].includes(system);

  const { user } = useAuthenticatedUser();
  const [dest, setDest] = useState({
    destApi: 'tapis',
    destSystem: 'designsafe.storage.default',
    destPath: encodeURIComponent('/' + user?.username),
  });
  const { destApi, destSystem, destPath } = dest;
  const { selectedFiles } = useSelectedFiles(api, system, path);

  const onBreadcrumbNavigate = (path: string) => {
    const newPath = path.split('/').slice(-1)[0];
    setDest({ ...dest, destPath: newPath });
  };

  const DestFilesColumns: TFileListingColumns = [
    {
      title: () => <span style={{ fontWeight: 'normal' }}>hii</span>,
      dataIndex: 'name',
      render: (data, record) =>
        record.type === 'dir' ? (
          <Button
            onClick={() =>
              onBreadcrumbNavigate(encodeURIComponent(record.path))
            }
            type="link"
          >
            {data}
          </Button>
        ) : (
          data
        ),
    },
  ];

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={onOk}
        width="60%"
        title="Copy Files"
      >
        <div style={{ display: 'flex', maxHeight: '60vh', gap: '50px' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Table
              style={{ border: '1px solid gray', height: '100%' }}
              columns={SelectedFilesColumns}
              dataSource={selectedFiles}
              pagination={false}
              rowKey={(record) => record.path}
              scroll={{ y: undefined }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              overflow: 'auto',
            }}
          >
            <DatafilesBreadcrumb
              initialBreadcrumbs={getInitialBreadcrumbs(
                api,
                system,
                isUserHomeSystem ? user?.username ?? '' : ''
              )}
              path={destPath}
              excludeBasePath={isUserHomeSystem}
              itemRender={(item) => {
                return (
                  <Button
                    type="link"
                    onClick={() => onBreadcrumbNavigate(item.path ?? '')}
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
                style={{ border: '1px solid gray' }}
                api={destApi}
                system={destSystem}
                path={destPath}
                columns={DestFilesColumns}
                rowSelection={undefined}
                scroll={{ y: undefined }}
              ></FileListingTable>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
