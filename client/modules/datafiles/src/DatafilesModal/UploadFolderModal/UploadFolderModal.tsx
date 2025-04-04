import React, { useState } from 'react';
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

  const handleReset = () => {
    setFileList([]);
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      for (let i = 0; i < fileList.length; i++) {
        const formData = new FormData();
        formData.append('uploaded_file', fileList[i] as FileType);
        formData.append('file_name', fileList[i].name);
        formData.append(
          'webkit_relative_path',
          fileList[i].webkitRelativePath || fileList[i].name
        );

        await mutate({
          api,
          system,
          scheme: 'private', // Optional
          path,
          uploaded_folder: formData,
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
    directory: true, //Set directory to true
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
      title={<h2>Upload Folder</h2>}
      width="60%"
      open={isOpen}
      footer={null} // Remove the footer from here
      onCancel={handleCancel}
    >
      <Upload {...props}>
        <div>
          Uploading to
          <span className={`fa fa-folder ${styles.pathText}`}>{newPath}</span>
        </div>
        <div>
          <b>
            {' '}
            Select folder (for more than 2GB or 25 files, please use Globus to
            upload)
          </b>
        </div>
        <Button icon={<UploadOutlined />}>Choose Folder</Button>
        <div>{fileList.length} staged for upload</div>
      </Upload>
      <div className={styles.customDiv}>
        <div>
          <Button
            type="dashed"
            onClick={handleReset}
            disabled={fileList.length === 0}
            loading={uploading}
            className={styles.marginTop16}
          >
            Reset
          </Button>
        </div>
        <Button
          type="primary"
          onClick={handleUpload}
          disabled={fileList.length === 0 || uploading}
          loading={uploading}
          className={styles.marginTop16}
        >
          {uploading ? 'Uploading' : 'Start Upload'}
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

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <UploadFolderModalBody
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
