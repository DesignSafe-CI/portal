import { Button, Modal, Form, Input } from 'antd';
import { useSelectedFiles, useRename } from '@client/hooks';
import React, { useState } from 'react';
import { TModalChildren } from '../DatafilesModal';

export const RenameModalBody: React.FC<{
  isOpen: boolean;
  api: string;
  system: string;
  path: string;
  handleCancel: () => void;
}> = ({ isOpen, api, system, path, handleCancel }) => {
  const { selectedFiles } = useSelectedFiles(api, system, path);
  const selectedFilesName = selectedFiles.length
    ? selectedFiles
    : [{ name: '' }];

  const { mutate } = useRename();

  const handleRenameFinish = async (values: { newName: string }) => {
    const newName = values.newName;

    try {
      await mutate({
        src: {
          api,
          system,
          path,
          name: selectedFiles[0].name,
          newName: newName,
        },
      });

      handleCancel(); // Close the modal after renaming
    } catch (error) {
      console.error('Error during form submission:', error);
      // Handle error if needed
    }
  };

  const validateNewName = (_: unknown, value: string) => {
    if (!value) {
      return Promise.reject('Please enter a new name.');
    }

    if (value === selectedFilesName[0].name) {
      return Promise.reject(
        'New name cannot be the same as the original name.'
      );
    }

    const pattern = /^[\d\w\s\-_.()]+$/;
    if (!pattern.test(value)) {
      return Promise.reject(
        'New name can only contain alphanumeric characters, spaces, hyphens, underscores, periods, and parentheses.'
      );
    }

    return Promise.resolve();
  };

  return (
    <Modal
      title={<h2>Rename {selectedFilesName[0]?.name}</h2>}
      width="60%"
      open={isOpen}
      destroyOnClose
      footer={null} // Remove the footer from here
      onCancel={handleCancel}
    >
      {isOpen && (
        <Form
          autoComplete="off"
          layout="vertical"
          initialValues={{ newName: selectedFiles[0]?.name }}
          onFinish={handleRenameFinish}
        >
          <Form.Item
            label="New Name"
            name="newName"
            rules={[
              {
                validator: validateNewName,
              },
            ]}
          >
            <Input
              type="textarea"
              placeholder="Please enter a new name for this file/folder."
            />
          </Form.Item>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <Button type="primary" htmlType="submit">
              Rename
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export const RenameModal: React.FC<{
  api: string;
  system: string;
  scheme?: string;
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

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <RenameModalBody
        api={api}
        system={system}
        path={path}
        isOpen={isModalOpen}
        handleCancel={handleCancel}
      />
    </>
  );
};
