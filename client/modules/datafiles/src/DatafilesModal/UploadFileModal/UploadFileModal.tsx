import React, { useState } from 'react';
import { Button, Modal, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import { useUploadFile } from '@client/hooks';
import { TModalChildren } from '../DatafilesModal';
import styles from './UploadFileModal.module.css';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

export const UploadFileModalBody: React.FC<{
  isOpen: boolean;
  api: string;
  system: string;
  scheme?: string;
  path: string;
  handleCancel: () => void;
}> = ({ isOpen, api, system, scheme, path, handleCancel }) => {
  const { mutate } = useUploadFile();

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [, setCurrentIndex] = useState(0);

  const handleReset = () => {
    setFileList([]);
    setCurrentIndex(0);
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const formData = new FormData();
        formData.append('uploaded_file', fileList[i] as FileType);
        formData.append('file_name', fileList[i].name);
        formData.append('webkit_relative_path', '');

        await mutate({
          api,
          system,
          scheme: 'private', // Optional
          path,
          uploaded_file: formData,
        });
      }

      // All files uploaded successfully, close the modal
      setUploading(false);
      handleCancel();
    } catch (error) {
      console.error('Error during form submission:', error);
      // Handle error if needed
      setUploading(false);
    }
  };

  const props: UploadProps = {
    multiple: true, // Enable multiple file selection
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      // Add the selected file to the existing fileList
      setFileList((prevFileList) => [...prevFileList, file]);
      return false; // Return false to prevent automatic uploading
    },
    fileList,
  };

  const newPath = path
    .replace(/%2F/g, '/')
    .replace(/^\//, '')
    .replace(/^/, ' ');

  return (
    <Modal
      title={<h2>Upload Files</h2>}
      width="60%"
      open={isOpen}
      footer={null} // Remove the footer from here
      onCancel={() => {
        handleCancel();
        handleReset();
      }}
    >
      <Upload {...props}>
        <div>
          Uploading to
          <span className={`fa fa-folder ${styles.pathText}`}>{newPath}</span>
        </div>
        <div>
          <b>
            {' '}
            Select files (for more than 2GB or 25 files, please use Globus to
            upload)
          </b>
        </div>
        <Button icon={<UploadOutlined />}>Choose Files</Button>
        <div>{fileList.length} staged for upload</div>
      </Upload>
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <Button
            type="dashed"
            onClick={handleReset}
            disabled={fileList.length === 0}
            loading={uploading}
            style={{ marginTop: 16 }}
          >
            Reset
          </Button>
        </div>
        <Button
          type="primary"
          onClick={handleUpload}
          disabled={fileList.length === 0 || uploading}
          loading={uploading}
          style={{ marginTop: 16 }}
        >
          {uploading ? 'Uploading' : 'Start Upload'}
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

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

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
