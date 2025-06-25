import React, { useState } from 'react';
import { Button, Modal, Upload, UploadFile, UploadProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useUploadFile } from '@client/hooks';
import type { TModalChildren } from '../DatafilesModal';

const MAX_FILES = 25;
const MAX_TOTAL_SIZE = 2 * 1024 ** 3; // 2 GB in bytes

export const UploadFileModalBody: React.FC<{
  isOpen: boolean;
  api: string;
  system: string;
  scheme?: string;
  path: string;
  handleCancel: () => void;
}> = ({ isOpen, api, system, scheme, path, handleCancel }) => {
  const { mutateAsync } = useUploadFile();

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const totalBytes = fileList.reduce((sum, f) => sum + (f.size ?? 0), 0);
  const overCount = fileList.length > MAX_FILES;
  const overSize = totalBytes > MAX_TOTAL_SIZE;
  const uploadDisabled =
    uploading || fileList.length === 0 || overCount || overSize;

  const handleReset = () => {
    setFileList([]);
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      for (const file of fileList) {
        const formData = new FormData();
        formData.append('uploaded_file', file as any);
        formData.append('file_name', file.name);
        formData.append('webkit_relative_path', '');

        await mutateAsync({
          api,
          system,
          scheme: scheme ?? 'private',
          path,
          uploaded_file: formData,
        });
      }
      setUploading(false);
      handleReset();
      handleCancel();
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    multiple: true,
    fileList,
    beforeUpload: (file) => {
      setFileList((prev) => [...prev, file]);
      return false; // prevent auto upload
    },
    onRemove: (file) => {
      setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
    },
  };

  const newPath = path.replace(/%2F/g, '/').replace(/^\//, '');

  return (
    <Modal
      title={<h2>Upload Files</h2>}
      width="60%"
      open={isOpen}
      footer={null}
      onCancel={() => {
        handleReset();
        handleCancel();
      }}
    >
      <Upload {...uploadProps}>
        <div>
          Uploading to&nbsp;
          <span className="fa fa-folder">&nbsp;{newPath || '/'}</span>
        </div>
        <div>
          <b>
            Select files (for more than 2 GB or {MAX_FILES} files, please use
            Globus)
          </b>
        </div>
        <Button icon={<UploadOutlined />}>Choose Files</Button>
      </Upload>

      <div style={{ marginTop: 12 }}>
        {fileList.length} file{fileList.length !== 1 && 's'} staged, total{' '}
        {(totalBytes / 1024 ** 3).toFixed(2)} GB
        {overCount && (
          <div style={{ color: 'red', marginTop: 4 }}>
            ⚠ You have selected more than {MAX_FILES} files.
          </div>
        )}
        {overSize && (
          <div style={{ color: 'red', marginTop: 4 }}>
            ⚠ Total size exceeds 2 GB limit.
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Button
          type="dashed"
          onClick={handleReset}
          disabled={fileList.length === 0 || uploading}
        >
          Reset
        </Button>
        <Button
          type="primary"
          onClick={handleUpload}
          disabled={uploadDisabled}
          loading={uploading}
        >
          {uploading ? 'Uploading…' : 'Start Upload'}
        </Button>
      </div>
    </Modal>
  );
};

export const UploadFileModal: React.FC<{
  api: string;
  system: string;
  scheme?: 'private';
  path: string;
  children: TModalChildren;
}> = ({ api, system, scheme, path, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <UploadFileModalBody
        api={api}
        system={system}
        scheme={scheme}
        path={path}
        isOpen={isModalOpen}
        handleCancel={handleCancel}
      />
    </>
  );
};
