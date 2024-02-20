import { useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Form, Input } from 'antd';
import {
  useAuthenticatedUser,
  useSelectedFiles,
  useRename,
} from '@client/hooks';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TModalChildren } from '../DatafilesModal';

export const RenameModalBody: React.FC<{
  isOpen: boolean;
  api: string;
  system: string;
  path: string;
  handleCancel: () => void;
}> = ({ isOpen, api, system, path, handleCancel }) => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const { selectedFiles } = useSelectedFiles(api, system, path);
  const selectedFilesName = selectedFiles.length
    ? selectedFiles
    : [{ name: '' }];
  const { user } = useAuthenticatedUser();
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const defaultDestParams = useMemo(
    () => ({
      destApi: 'tapis',
      destSystem: 'designsafe.storage.default',
      destPath: encodeURIComponent('/' + user?.username),
    }),
    [user]
  );

  const [dest, setDest] = useState(defaultDestParams);
  const { destApi, destSystem } = dest;
  useEffect(() => setDest(defaultDestParams), [defaultDestParams]);

  const { mutate } = useRename();
  const updateFileName = useCallback(
     (newName: string, path: string) => {
      mutate({
        src: { api, system, path, name: selectedFiles[0].name, newName: newName },
      });
        handleClose();
    },
    [selectedFiles, mutate, destApi, destSystem, api, system]
  );

  const handleRenameClick = async () => {
    const path: string = user?.username ?? '';
    const newName = form.getFieldValue('newName');
    updateFileName(newName, path);
  };

  const handleClose = useCallback(() => {
    // Flush queries on close to prevent stale postits being read from cache.
    queryClient.removeQueries({ queryKey: ['datafiles', 'preview'] });
    handleCancel();
  }, [handleCancel, queryClient]);

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

  const validateForm = async () => {
    // Validate the fields to update errors
    const values = await form.validateFields();

    // Check if any fields have validation errors
    const hasErrors = form
      .getFieldsError()
      .some((fieldError) => fieldError.errors.length > 0);

    setIsButtonDisabled(hasErrors);

    // Return the values of the form fields
    return values;
  };

  React.useEffect(() => {
    const setInitialValidationStatus = async () => {
      // Set initial validation status for the "newName" field
      await form.validateFields(['newName']);

      form.setFields([
        {
          name: 'newName',
          errors: ['Please enter a new name.'],
        },
      ]);

      // Check if there are no errors and enable the button
      setIsButtonDisabled(false);
    };

    setInitialValidationStatus();
  }, [form]);

  return (
    <Modal
      title={<h2>Rename {selectedFilesName[0].name}</h2>}
      width="60%"
      open={isOpen}
      footer={null} // Remove the footer from here
      onCancel={handleClose}
    >
      <Form autoComplete="off" form={form} layout="vertical">
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
      </Form>

      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <Button
          type="primary"
          onClick={async () => {
            if (!isButtonDisabled) {
              await validateForm();
              handleRenameClick(); // Call handleRenameClick only if the button is not disabled
            }
          }}
          disabled={isButtonDisabled}
        >
          Rename
        </Button>
      </div>
    </Modal>
  );
};

export const RenameModal: React.FC<{
  api: string;
  system: string;
  scheme?: string;
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
