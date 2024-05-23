import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Modal, Select } from 'antd';
import {
  useAuthenticatedUser,
  usePathDisplayName,
  useGetSystems,
  TTapisSystem,
  TUser,
} from '@client/hooks';

import { BaseFileListingBreadcrumb } from '@client/common-components';
import styles from './SelectModal.module.css';
import {
  FileListingTable,
  TFileListingColumns,
} from '@client/common-components';
import { SelectModalProjectListing } from './SelectModalProjectListing';

type TModalChildren = (props: {
  onClick: React.MouseEventHandler<HTMLElement>;
}) => React.ReactElement;

const api = 'tapis';
const HeaderTitle: React.FC<{
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

// Use isMyData is note as an indicate of private vs public
const getScheme = (storageSystem: TTapisSystem): string => {
  return storageSystem.notes?.isMyData ? 'private' : 'public';
};

const getPath = (
  storageSystem: TTapisSystem,
  user: TUser | undefined
): string => {
  return storageSystem.notes?.isMyData
    ? encodeURIComponent('/' + user?.username)
    : '';
};

function getFilesColumns(
  api: string,
  system: string,
  path: string,
  selectionCallback: (path: string) => void,
  navCallback: (path: string) => void
): TFileListingColumns {
  return [
    {
      title: <HeaderTitle api={api} system={system} path={path} />,
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
      title: '',
      render: (_, record) => (
        <Button
          type="primary"
          onClick={() =>
            selectionCallback(`${api}://${record.system}${record.path}`)
          }
        >
          Select
        </Button>
      ),
    },
  ];
}

export const SelectModal: React.FC<{
  onSelect: (value: string) => void;
  children: TModalChildren;
}> = ({ onSelect, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);
  const { user } = useAuthenticatedUser();
  const {
    data: { storageSystems, defaultStorageSystem },
  } = useGetSystems();
  // only pick up enabled systems with label
  const includedSystems = storageSystems.filter(
    (s) => s.enabled && s.notes?.label
  );

  const systemOptions = includedSystems.map((system) => ({
    label: system.notes.label,
    value: system.id,
  }));
  systemOptions.push({ label: 'My Projects', value: 'myprojects' });

  const defaultParams = useMemo(
    () => ({
      selectedApi: api,
      selectedSystem: defaultStorageSystem.id,
      selectedPath: getPath(defaultStorageSystem, user),
      scheme: getScheme(defaultStorageSystem),
    }),
    [user]
  );

  const [selection, setSelection] = useState<{
    selectedApi: string;
    selectedSystem: string;
    selectedPath: string;
    scheme?: string;
    projectId?: string;
  }>(defaultParams);

  const [showProjects, setShowProjects] = useState<boolean>(false);
  const { selectedApi, selectedSystem, selectedPath, scheme } = selection;
  useEffect(() => setSelection(defaultParams), [isModalOpen, defaultParams]);
  const [dropdownValue, setDropdownValue] = useState<string>(
    defaultStorageSystem.id
  );
  const dropdownCallback = (newValue: string) => {
    setDropdownValue(newValue);

    if (newValue === 'myprojects') {
      setShowProjects(true);
      return;
    }

    const system = includedSystems.find((s) => s.id === newValue);
    if (!system) return;

    setShowProjects(false);
    setSelection({
      selectedApi: api,
      selectedSystem: system.id,
      selectedPath: getPath(system, user),
      scheme: getScheme(system),
    });
  };

  const onProjectSelect = (uuid: string, projectId: string) => {
    setShowProjects(false);
    setSelection({
      selectedApi: api,
      selectedSystem: `project-${uuid}`,
      selectedPath: '',
      projectId: projectId,
    });
  };

  const navCallback = useCallback(
    (path: string) => {
      if (path === 'PROJECT_LISTING') {
        setShowProjects(true);
        return;
      }
      const newPath = path.split('/').slice(-1)[0];
      setSelection({ ...selection, selectedPath: newPath });
    },
    [selection]
  );

  const selectCallback = useCallback(
    (path: string) => {
      onSelect(path);
      handleClose();
    },
    [selectedApi, selectedSystem]
  );

  const FileColumns = useMemo(
    () =>
      getFilesColumns(
        selectedApi,
        selectedSystem,
        selectedPath,
        (selection: string) => selectCallback(selection),
        navCallback
      ),
    [navCallback, selectedApi, selectedSystem, selectedPath]
  );

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width="40%"
        title={<h2>SELECT FILE</h2>}
        footer={null}
      >
        <article className={styles.modalContent}>
          <div className={styles.modalPanel}>
            <Select
              options={systemOptions}
              style={{ marginBottom: '12px' }}
              virtual={false}
              value={dropdownValue}
              onChange={(newValue) => dropdownCallback(newValue)}
            />
            <section className={styles.filesSection}>
              {!showProjects && (
                <>
                  <BaseFileListingBreadcrumb
                    api={selectedApi}
                    system={selectedSystem}
                    path={decodeURIComponent(selectedPath)}
                    systemRootAlias={selection.projectId}
                    initialBreadcrumbs={
                      selectedSystem.startsWith('project-')
                        ? [{ title: 'My Projects', path: 'PROJECT_LISTING' }]
                        : []
                    }
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
                  <div className={styles.filesTableContainer}>
                    <FileListingTable
                      api={selectedApi}
                      system={selectedSystem}
                      path={selectedPath}
                      columns={FileColumns}
                      rowSelection={undefined}
                      scheme={scheme}
                      scroll={undefined}
                    />
                  </div>
                </>
              )}
              {showProjects && (
                <div className={styles.destFilesTableContainer}>
                  <SelectModalProjectListing
                    onSelect={(uuid, projectId) =>
                      onProjectSelect(uuid, projectId)
                    }
                  />
                </div>
              )}
            </section>
          </div>
        </article>
      </Modal>
    </>
  );
};
