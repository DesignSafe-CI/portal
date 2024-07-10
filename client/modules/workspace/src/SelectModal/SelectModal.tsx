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
import {
  CaretDownOutlined,
  CaretUpOutlined,
  LeftOutlined,
} from '@ant-design/icons';

import {
  useAuthenticatedUser,
  usePathDisplayName,
  useGetSystems,
  TTapisSystem,
  TUser,
  TFileListing,
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

const getSystemRootPath = (
  storageSystem: TTapisSystem | undefined,
  user: TUser | undefined
): string => {
  return storageSystem?.notes?.isMyData
    ? encodeURIComponent('/' + user?.username)
    : '';
};

const getBackPath = (
  encodedPath: string,
  searchTerm: string | null,
  clearSearchTerm: () => void,
  system: TTapisSystem | undefined,
  user: TUser | undefined
): string => {
  if (searchTerm) {
    clearSearchTerm();
    return encodedPath;
  }
  const pathParts = decodeURIComponent(encodedPath).split('/');
  const isRootPath = pathParts.join('/') === getSystemRootPath(system, user);
  if (!isRootPath) {
    pathParts.pop();
  }
  return encodeURIComponent(pathParts.join('/'));
};

const getParentFolder = (
  name: string,
  system: string,
  path: string
): TFileListing => {
  return {
    format: 'folder',
    lastModified: '',
    length: 1,
    type: 'dir',
    mimeType: '',
    name: name,
    permissions: '',
    path: decodeURIComponent(path),
    system: system,
  };
};

function getFilesColumns(
  api: string,
  path: string,
  selectionMode: string,
  searchTerm: string | null,
  clearSearchTerm: () => void,
  selectionCallback: (path: string) => void,
  navCallback: (path: string) => void,
  user: TUser | undefined,
  selectedSystem?: TTapisSystem
): TFileListingColumns {
  return [
    {
      title: (
        <div>
          <Button
            type="link"
            onClick={() =>
              navCallback(
                getBackPath(
                  path,
                  searchTerm,
                  clearSearchTerm,
                  selectedSystem,
                  user
                )
              )
            }
          >
            <LeftOutlined />
            Back
          </Button>
        </div>
      ),
      dataIndex: 'name',
      ellipsis: true,

      render: (data, record, index) => {
        const isFolder = record.format === 'folder';
        const marginLeft = index === 0 ? '3rem' : '6rem';
        const commonStyle = {
          marginLeft,
          textAlign: 'center' as const,
          display: 'flex',
          alignItems: 'center',
        };
        const iconClassName = isFolder ? 'fa fa-folder-o' : 'fa fa-file-o';

        if (isFolder && index > 0) {
          return (
            <Button
              style={commonStyle}
              onClick={() => navCallback(encodeURIComponent(record.path))}
              type="link"
            >
              <i
                role="none"
                className={iconClassName}
                style={{ color: '#333333', marginRight: '8px' }}
              ></i>
              {data}
            </Button>
          );
        }

        return (
          <span style={commonStyle}>
            <i
              role="none"
              className={iconClassName}
              style={{ color: '#333333', marginRight: '8px' }}
            ></i>
            {data}
          </span>
        );
      },
    },
    {
      dataIndex: 'path',
      align: 'end',
      title: '',
      render: (_, record, index) => {
        const selectionModeAllowed =
          (record.type === 'dir' && selectionMode === 'directory') ||
          (record.type === 'file' && selectionMode === 'file') ||
          selectionMode === 'both';
        const isNotRoot =
          index > 0 || path !== getSystemRootPath(selectedSystem, user);
        const shouldRenderSelectButton = isNotRoot && selectionModeAllowed;

        return shouldRenderSelectButton ? (
          <SecondaryButton
            onClick={() =>
              selectionCallback(`${api}://${record.system}${record.path}`)
            }
          >
            Select
          </SecondaryButton>
        ) : null;
      },
    },
  ];
}

export const SelectModal: React.FC<{
  inputLabel: string;
  system: string | null;
  selectionMode: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
}> = ({ inputLabel, system, selectionMode, isOpen, onClose, onSelect }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [form] = Form.useForm();
  const getPathName = usePathDisplayName();

  const handleClose = () => {
    setIsModalOpen(false);
    form.resetFields();
    onClose();
  };
  const clearSearchTerm = () => {
    form.resetFields();
    setSearchTerm(null);
  };
  useEffect(() => {
    if (isModalOpen) {
      clearSearchTerm();
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
      selectedSystemId: defaultStorageSystem.id,
      selectedSystem: defaultStorageSystem,
      selectedPath: getSystemRootPath(defaultStorageSystem, user),
      scheme: getScheme(defaultStorageSystem),
    }),
    [defaultStorageSystem, user]
  );

  const [selection, setSelection] = useState<{
    selectedApi: string;
    selectedSystemId: string;
    selectedPath: string;
    scheme?: string;
    projectId?: string;
    selectedSystem?: TTapisSystem;
  }>(defaultParams);
  const [systemLabel, setSystemLabel] = useState<string>(
    defaultStorageSystem.notes.label ?? defaultStorageSystem.id
  );
  const [showProjects, setShowProjects] = useState<boolean>(false);
  const {
    selectedApi,
    selectedSystemId,
    selectedSystem,
    selectedPath,
    scheme,
  } = selection;
  useEffect(() => setSelection(defaultParams), [isModalOpen, defaultParams]);
  const [dropdownValue, setDropdownValue] = useState<string>(
    defaultStorageSystem.id
  );
  const dropdownCallback = (newValue: string) => {
    setDropdownValue(newValue);
    if (newValue === 'myprojects') {
      setShowProjects(true);
      setSelection({
        selectedApi: api,
        selectedSystemId: '',
        selectedSystem: undefined,
        selectedPath: '',
        scheme: '',
      });
      setSystemLabel('My Projects');
      return;
    }

    const system = includedSystems.find((s) => s.id === newValue);
    if (!system) return;

    setShowProjects(false);
    setSelection({
      selectedApi: api,
      selectedSystemId: system.id,
      selectedSystem: system,
      selectedPath: getSystemRootPath(system, user),
      scheme: getScheme(system),
    });
    setSystemLabel(system.notes.label ?? system.id);
  };

  const onProjectSelect = (uuid: string, projectId: string) => {
    setShowProjects(false);
    setSelection({
      selectedApi: api,
      selectedSystemId: `project-${uuid}`,
      selectedPath: '',
      projectId: projectId,
      selectedSystem: undefined, //not using system for project
    });
    // Intended to indicate searching the root path of a project.
    setSystemLabel('root');
  };

  useEffect(() => {
    if (isModalOpen) {
      let systemValue = system ?? defaultStorageSystem.id;
      if (systemValue.startsWith('project-')) {
        systemValue = 'myprojects';
      }
      dropdownCallback(systemValue);
    }
  }, [system, isModalOpen]);

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
        selectedPath,
        selectionMode,
        searchTerm,
        clearSearchTerm,
        (selection: string) => selectCallback(selection),
        navCallback,
        user,
        selectedSystem
      ),
    [
      navCallback,
      selectedApi,
      selectedSystemId,
      selectedSystem,
      selectedPath,
      systemLabel,
      selectionMode,
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
                system={selectedSystemId}
                path={decodeURIComponent(selectedPath)}
                systemRootAlias={selection.projectId}
                initialBreadcrumbs={
                  selectedSystemId.startsWith('project-')
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
                  system={selectedSystemId}
                  path={selectedPath}
                  columns={FileColumns}
                  rowSelection={undefined}
                  scheme={scheme}
                  scroll={undefined}
                  searchTerm={searchTerm}
                  currentDisplayPath={getParentFolder(
                    getPathName(
                      selectedApi,
                      selectedSystemId,
                      selectedPath,
                      systemLabel
                    ),
                    selectedSystemId,
                    selectedPath
                  )}
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
