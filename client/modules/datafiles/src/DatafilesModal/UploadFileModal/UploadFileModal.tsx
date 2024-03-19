import React, { useState } from 'react';
import { Button, Modal } from 'antd';
import { useUploadFolder } from '@client/hooks'; // Updated import
import { TModalChildren } from '../DatafilesModal';

export const UploadFileModalBody: React.FC<{
  isOpen: boolean;
  api: string;
  system: string;
  scheme?: string;
  path: string;
  handleCancel: () => void;
}> = ({ isOpen, api, system, scheme, path, handleCancel }) => {
  const { mutate } = useUploadFolder(); // Updated hook
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const formData = new FormData();
    formData.append('uploaded_folder', files[0]);

    setUploading(true);
    try {
      await mutate({
        api,
        system,
        scheme: 'private',
        path,
        uploaded_folder: formData,
      });
      // All files uploaded successfully, close the modal
      setUploading(false);
      handleCancel();
    } catch (error) {
      console.error('Error during form submission:', error);
      // Handle error if needed
      setUploading(false);
    }
  };

  return (
    <>
      <Modal
        title={<h2>Upload File</h2>}
        width="60%"
        visible={isOpen}
        footer={null}
        onCancel={handleCancel}
      >
        <div>Uploading to <span className="fa fa-folder"> {path}:</span></div>
        <div>
          <b>Select a filde to upload:</b>
          <input type="file" onChange={handleUpload} />
        </div>
        <Button
          type="primary"
          onClick={handleCancel}
          disabled={uploading}
          style={{ marginTop: 16 }}
        >
          Cancel
        </Button>
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
        isOpen={isModalOpen}
        api={api}
        system={system}
        scheme={scheme}
        path={path}
        handleCancel={handleCancel}
      />
    </>
  );
};