import { useQueryClient } from '@tanstack/react-query';
import { useFilePreview } from '@client/hooks';
import { Button, Modal, Form, Input } from 'antd';
import React, { useCallback, useState } from 'react';
import { TModalChildren } from '../DatafilesModal';

export const RenameModalBody: React.FC<{
  isOpen: boolean;
  api: string;
  system: string;
  scheme?: string;
  path: string;
  handleCancel: () => void;
}> = ({ isOpen, api, system, scheme, path, handleCancel }) => {
  /* 
  Typically modals are rendered in the same component as the button that manages the
  open/closed state. The modal body is exported separately for file previews, since 
  the modal might be rendered hundreds of times in a listing and impact performance.
   */
  const queryClient = useQueryClient();
  const { data, isLoading } = useFilePreview({
    api,
    system,
    scheme,
    path,
    queryOptions: { enabled: isOpen },
  });
  const [form] = Form.useForm();

  const handleClose = useCallback(() => {
    // Flush queries on close to prevent stale postits being read from cache.
    queryClient.removeQueries({ queryKey: ['datafiles', 'preview'] });
    handleCancel();
  }, [handleCancel, queryClient]);

  return (
    <Modal
      title={<h2>Rename {path}</h2>}
      width="60%"
      open={isOpen}
      footer={() => (
        <>
            <Button onClick={handleClose}>
                Cancel
            </Button>
            <Button onClick={handleClose} type="primary">
                Rename
            </Button>
        </>
      )}
      onCancel={handleClose}
    >
        <Form form={form} layout="vertical">
            <Form.Item
                label="New Name"
                name="New Name"
                rules={[
                    { required: true, message: "Please enter a new name for this file/folder." }
                ]}
                >
                <Input type="textarea"/>
            </Form.Item>
        </Form>
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
        scheme={scheme}
        path={path}
        isOpen={isModalOpen}
        handleCancel={handleCancel}
      />
    </>
  );
};
