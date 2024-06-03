import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Modal,
  Select,
  Input,
  Form,
  ConfigProvider,
  ThemeConfig,
} from 'antd';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';

import {
  useAuthenticatedUser,
  usePathDisplayName,
  useGetSystems,
  TTapisSystem,
  TUser,
} from '@client/hooks';

import {
  BaseFileListingBreadcrumb,
  FileListingTable,
  SecondaryButton,
  TFileListingColumns,
} from '@client/common-components';
import styles from './SelectModal.module.css';
import { SelectModalProjectListing } from './SelectModalProjectListing';

const api = 'tapis';
const portalName = 'DesignSafe';
const HeaderTitle: React.FC<{
  api: string;
  system: string;
  path: string;
  label: string;
}> = ({ api, system, path, label }) => {
  const getPathName = usePathDisplayName();
  return (
    <span style={{ fontWeight: 'normal' }}>
      <i role="none" className="fa fa-folder-o">
        &nbsp;&nbsp;
      </i>
      {getPathName(api, system, path, label)}
    </span>
  );
};

const SystemSuffixIcon = () => {
  return (
    <div
      style={{
        paddingTop: '5px',
        paddingBottom: '5px',
        position: 'relative',
        width: '16px',
        height: '24px',
        marginTop: '5px',
        marginRight: '-10px',
        pointerEvents: 'none',
      }}
    >
      <CaretUpOutlined
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      />
      <CaretDownOutlined
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          transform: `translateY(-5px)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

const modalStyles = {
  header: {
    borderRadius: 0,
    borderBottom: 0,
    paddingBottom: '20px',
    paddingTop: '20px',
    paddingLeft: '20px',
    paddingRight: '20px',
    backgroundColor: '#f4f4f4',
  },
  body: {
    paddingLeft: '40px',
    paddingRight: '40px',
    paddingBottom: '20px',
    paddingTop: '20px',
  },
  content: {
    boxShadow: '0 0 30px #999',
    padding: '0px',
  },
};

const systemSelectThemeConfig: ThemeConfig = {
  token: {
    borderRadius: 4,
  },
};

// Use isMyData in notes as an indicate of private vs public
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
  systemLabel: string,
  selectionCallback: (path: string) => void,
  navCallback: (path: string) => void
): TFileListingColumns {
  return [
    {
      title: (
        <HeaderTitle
          api={api}
          system={system}
          path={path}
          label={systemLabel}
        />
      ),
      dataIndex: 'name',
      ellipsis: true,

      render: (data, record) =>
        record.format === 'folder' ? (
          <Button
            style={{
              marginLeft: '3rem',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => navCallback(encodeURIComponent(record.path))}
            type="link"
          >
            <i
              role="none"
              className="fa fa-folder-o"
              style={{ color: '#333333', marginRight: '8px' }}
            ></i>
            {data}
          </Button>
        ) : (
          <span
            style={{
              marginLeft: '3rem',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <i
              role="none"
              className="fa fa-file-o"
              style={{ color: '#333333', marginRight: '8px' }}
            ></i>
            {data}
          </span>
        ),
    },
    {
      dataIndex: 'path',
      align: 'end',
      title: '',
      render: (_, record) => (
        <SecondaryButton
          onClick={() =>
            selectionCallback(`${api}://${record.system}${record.path}`)
          }
        >
          Select
        </SecondaryButton>
      ),
    },
  ];
}

export const SelectModal: React.FC<{
  inputLabel: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
}> = ({ inputLabel, isOpen, onClose, onSelect }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [form] = Form.useForm();

  const handleClose = () => {
    setIsModalOpen(false);
    form.resetFields();
    onClose();
  };
  useEffect(() => {
    if (isModalOpen) {
      form.resetFields();
      setSearchTerm(null);
    }
  }, [form, isModalOpen]);
  const { user } = useAuthenticatedUser();
  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen]);
  const {
    data: { storageSystems, defaultStorageSystem },
  } = useGetSystems();

  // only pick up enabled systems in this portal
  const includedSystems = storageSystems.filter(
    (s) => s.enabled && s.notes?.portalNames?.includes(portalName)
  );

  // Sort - so mydata is shown first.
  const systemOptions = includedSystems
    .sort((a, b) => {
      return (a.notes?.isMyData ? 0 : 1) - (b.notes?.isMyData ? 0 : 1);
    })
    .map((system) => ({
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
    [defaultStorageSystem, user]
  );

  const [selection, setSelection] = useState<{
    selectedApi: string;
    selectedSystem: string;
    selectedPath: string;
    scheme?: string;
    projectId?: string;
  }>(defaultParams);
  const [systemLabel, setSystemLabel] = useState<string>(
    defaultStorageSystem.notes.label ?? defaultStorageSystem.id
  );
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
      setSystemLabel('My Projects');
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
    setSystemLabel(system.notes.label ?? system.id);
  };

  const onProjectSelect = (uuid: string, projectId: string) => {
    setShowProjects(false);
    setSelection({
      selectedApi: api,
      selectedSystem: `project-${uuid}`,
      selectedPath: '',
      projectId: projectId,
    });
    // Intended to indicate searching the root path of a project.
    setSystemLabel('root');
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
    [handleClose, onSelect]
  );

  const FileColumns = useMemo(
    () =>
      getFilesColumns(
        selectedApi,
        selectedSystem,
        selectedPath,
        systemLabel,
        (selection: string) => selectCallback(selection),
        navCallback
      ),
    [
      navCallback,
      selectedApi,
      selectedSystem,
      selectedPath,
      systemLabel,
      selectCallback,
    ]
  );

  return (
    <Modal
      open={isModalOpen}
      onCancel={handleClose}
      width="40%"
      footer={null}
      styles={modalStyles}
      title={<span className={styles.modalTitle}>Select</span>}
    >
      <article className={styles.modalContent}>
        <div className={styles.modalPanel}>
          <div className={styles.dataFilesModalColHeader}>
            Select {inputLabel}
          </div>
          <div className={styles.selectRowContainer}>
            <div className={styles.systemSelectRow}>
              <ConfigProvider theme={systemSelectThemeConfig}>
                <Select
                  options={systemOptions}
                  virtual={false}
                  value={dropdownValue}
                  onChange={(newValue) => dropdownCallback(newValue)}
                  className={styles.systemSelect}
                  popupMatchSelectWidth={false}
                  suffixIcon={<SystemSuffixIcon />}
                />
              </ConfigProvider>
            </div>
            <div className={styles.selectRowItem}>
              <BaseFileListingBreadcrumb
                className={styles.breadCrumbItem}
                api={selectedApi}
                system={selectedSystem}
                path={decodeURIComponent(selectedPath)}
                systemRootAlias={selection.projectId}
                initialBreadcrumbs={
                  selectedSystem.startsWith('project-')
                    ? [{ title: 'My Projects', path: 'PROJECT_LISTING' }]
                    : []
                }
                systemLabel={systemLabel}
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
            </div>
          </div>
          <Form
            form={form}
            onFinish={(data) => {
              if (data.query) {
                setSearchTerm(data.query);
              } else {
                setSearchTerm(null);
              }
            }}
            style={{ display: 'inline-flex', marginBottom: '20px' }}
          >
            <Button htmlType="submit" className="ant-btn">
              <i className="fa fa-search" style={{ marginRight: '8px' }}></i>
              Search
            </Button>
            <Form.Item name="query" style={{ marginBottom: 0, width: '100%' }}>
              <Input
                placeholder={`Search ${systemLabel}`}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
          <section className={styles.filesSection}>
            {!showProjects && (
              <div className={styles.filesTableContainer}>
                <FileListingTable
                  api={selectedApi}
                  system={selectedSystem}
                  path={selectedPath}
                  columns={FileColumns}
                  rowSelection={undefined}
                  scheme={scheme}
                  scroll={undefined}
                  searchTerm={searchTerm}
                />
              </div>
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
  );
};
