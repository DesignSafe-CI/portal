import { Button, Modal, Form, Input } from 'antd';
import { useNewFolder } from '@client/hooks';
import React, { useState, useEffect } from 'react';
import { TModalChildren } from '../DatafilesModal';
import styles from './NewFolderModal.module.css';

export const NewFolderModalBody: React.FC<{
  isOpen: boolean;
  api: string;
  system: string;
  path: string;
  handleCancel: () => void;
}> = ({ isOpen, api, system, path, handleCancel }) => {
  const { mutate } = useNewFolder();
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      form.resetFields();
    }
  }, [isOpen, form]);

  const handleNewFolderFinish = async (values: { newFolder: string }) => {
    const newFolder = values.newFolder;

    mutate(
      {
        src: {
          api,
          system,
          path,
          dirName: newFolder,
        },
      },
      { onSuccess: () => handleCancel() }
    );

    // Close the modal after creating new folder
  };

  const validateNewFolder = (_: unknown, value: string) => {
    if (!value) {
      return Promise.reject('Please enter a folder name.');
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
      title={<h2>Enter a name for the new folder</h2>}
      width="60%"
      open={isOpen}
      footer={null} // Remove the footer from here
      onCancel={handleCancel}
    >
      <Form
        form={form}
        autoComplete="off"
        layout="vertical"
        onFinish={handleNewFolderFinish}
      >
        <Form.Item
          label="Folder Name"
          name="newFolder"
          rules={[
            {
              validator: validateNewFolder,
            },
          ]}
        >
          <Input
            type="textarea"
            placeholder="Please enter a new name for this folder."
          />
        </Form.Item>

        <div className={styles.customDiv}>
          <Button type="primary" htmlType="submit">
            Create Folder
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export const NewFolderModal: React.FC<{
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
      <NewFolderModalBody
        api={api}
        system={system}
        path={path}
        isOpen={isModalOpen}
        handleCancel={handleCancel}
      />
    </>
  );
};
