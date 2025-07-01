import React, { useState, useMemo } from 'react';
import { Button, Modal, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import { useUploadFolder } from '@client/hooks';
import { TModalChildren } from '../DatafilesModal';
import styles from './UploadFolderModal.module.css';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
interface CustomUploadFile<T = unknown> extends UploadFile<T> {
  webkitRelativePath?: string;
}

const MAX_FILES = 25;
const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

export const UploadFolderModalBody: React.FC<{
  isOpen: boolean;
  api: string;
  system: string;
  scheme?: string;
  path: string;
  handleCancel: () => void;
}> = ({ isOpen, api, system, scheme, path, handleCancel }) => {
  const { mutate } = useUploadFolder();
  const [fileList, setFileList] = useState<CustomUploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // derive counts & total
  const fileCount = fileList.length;
  const totalSize = useMemo(
    () => fileList.reduce((sum, f) => sum + (f.size || 0), 0),
    [fileList]
  );

  const overFileLimit = fileCount > MAX_FILES;
  const overSizeLimit = totalSize > MAX_BYTES;

  const handleReset = () => setFileList([]);
  const handleUpload = async () => {
    setUploading(true);
    try {
      for (const f of fileList) {
        const formData = new FormData();
        formData.append('uploaded_file', f as FileType);
        formData.append('file_name', f.name);
        formData.append('webkit_relative_path', f.webkitRelativePath || f.name);
        await mutate({
          api,
          system,
          scheme: 'private',
          path,
          uploaded_folder: formData,
        });
      }
      setUploading(false);
      handleCancel();
      setFileList([]);
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    setFileList((prev) => [...prev, file as CustomUploadFile]);
    return false;
  };

  const props: UploadProps = {
    directory: true,
    fileList,
    onRemove: (file) =>
      setFileList((prev) => prev.filter((f) => f.uid !== file.uid)),
    beforeUpload,
  };

  const fmtGB = (bytes: number) =>
    `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;

  const displayPath = path.replace(/%2F/g, '/').replace(/^\/?/, ' ');

  return (
    <Modal
      title={<h2>Upload Folder</h2>}
      width="60%"
      open={isOpen}
      footer={null}
      onCancel={() => {
        handleCancel();
        handleReset();
      }}
    >
      <Upload {...props}>
        <div>
          Uploading to
          <span className={`fa fa-folder ${styles.pathText}`}>
            {displayPath}
          </span>
        </div>
        <div>
          <b>
            Select folder (for more than 2 GB or 25 files, please use Globus)
          </b>
        </div>
        <Button icon={<UploadOutlined />} disabled={overFileLimit || uploading}>
          Choose Folder
        </Button>
        <div>
          {fileCount} file{fileCount !== 1 && 's'} staged — {fmtGB(totalSize)}
        </div>
      </Upload>

      {overFileLimit && (
        <div style={{ color: 'red', marginTop: 4 }}>
          ⚠ Too many files selected (max {MAX_FILES}).
        </div>
      )}
      {overSizeLimit && (
        <div style={{ color: 'red', marginTop: 4 }}>
          ⚠ Total size exceeds 2 GB limit ({fmtGB(totalSize)}).
        </div>
      )}

      <div className={styles.customDiv}>
        <Button
          type="dashed"
          onClick={handleReset}
          disabled={fileCount === 0 || uploading}
          loading={uploading}
          className={styles.marginTop16}
        >
          Reset
        </Button>
        <Button
          type="primary"
          onClick={handleUpload}
          disabled={
            fileCount === 0 || uploading || overFileLimit || overSizeLimit
          }
          loading={uploading}
          className={styles.marginTop16}
        >
          {uploading ? 'Uploading…' : 'Start Upload'}
        </Button>
      </div>
    </Modal>
  );
};

export const UploadFolderModal: React.FC<{
  api: string;
  system: string;
  scheme?: 'private';
  path: string;
  children: TModalChildren;
}> = ({ api, system, scheme, path, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const show = () => setIsModalOpen(true);
  const hide = () => setIsModalOpen(false);

  return (
    <>
      {React.createElement(children, { onClick: show })}
      <UploadFolderModalBody
        api={api}
        system={system}
        scheme={scheme}
        path={path}
        isOpen={isModalOpen}
        handleCancel={hide}
      />
    </>
  );
};
