import React, { useState } from 'react';
import { Button, Modal, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { useUploadFile } from '@client/hooks';
import { TModalChildren } from '../DatafilesModal';

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

  const handleReset = () => {
    setFileList([]);
  };

  const handleUpload = async (values: { newFile: UploadFile[] }) => {
    const { newFile } = values;

    setUploading(true);
    try {
      await mutate({
        src: {
          api,
          system,
          scheme: "private",
          path,
          uploaded_file: newFile, // Make sure uploaded_file is correctly passed
        },
      });
      handleCancel(); // Close the modal after creating new folder
    } catch (error) {
      console.error('Error during form submission:', error);
      // Handle error if needed
    }
  };

  const props: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([...fileList, file]);

      return false;
    },
    fileList,
  };

  return (
    <>
    <Modal
      title={<h2>Upload Files</h2>}
      width="60%"
      open={isOpen}
      footer={null} // Remove the footer from here
      onCancel={handleCancel}
    >
      <Upload {...props}>
        <div >Uploading to 
            <span className="fa fa-folder"> {path}:</span>
        </div>
        <div><b> Select files (for more than 2GB or 25 files, please use Globus to upload)</b></div>
        <Button icon={<UploadOutlined />}>Choose Files</Button>
        <div>{fileList.length} staged for upload</div>
      </Upload>
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
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
            onClick={() => handleUpload({ newFile: fileList })}
            disabled={fileList.length === 0}
            loading={uploading}
            style={{ marginTop: 16 }}
        >
            {uploading ? 'Uploading' : 'Start Upload'}
        </Button>
      </div>
      </Modal>
    </>
  );
};

export const UploadFileModal: React.FC<{
  api: string;
  system: string;
  scheme?: "private";
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
