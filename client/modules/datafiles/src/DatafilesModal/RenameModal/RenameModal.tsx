import { useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Form, Input } from 'antd';
import { useAuthenticatedUser, useSelectedFiles, useRename } from '@client/hooks';
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
  const selectedFilesName = selectedFiles.length ? selectedFiles : [{name: ''}]
  const { user } = useAuthenticatedUser();
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
        src: { api, system, path, name: selectedFiles[0].name },
        dest: { api: destApi, system: destSystem, path:path, name: newName },
      });
      handleClose();
    },
    [selectedFiles, mutate, destApi, destSystem, api, system]
  );

  const handleRenameClick = () => {
    const path: string = user?.username ?? '';
    let newName = form.getFieldValue('newName');
    console.log(newName)
    updateFileName(newName, path)
  };

  const handleClose = useCallback(() => {
    // Flush queries on close to prevent stale postits being read from cache.
    queryClient.removeQueries({ queryKey: ['datafiles', 'preview'] });
    handleCancel();
  }, [handleCancel, queryClient]);


  return (
    <Modal
      title={<h2>Rename {selectedFilesName[0].name}</h2>}  // 
      width="60%"
      open={isOpen}
      footer={() => (
        <Button type="primary" onClick={handleRenameClick} >
            Rename
        </Button>
      )}
      onCancel={handleClose}
    >
        <Form autoComplete="off" form={form} layout="vertical">
          <Form.Item
            label="New Name"
            name="newName"
            rules={[
              { required: true, message: "Please enter a new name for this file/folder." },
              { pattern: /^[\d\w\s\-_.()]+$/, message: 'Please enter a valid file name (accepted characters are A-Z a-z 0-9 () - _ .)' }
            ]}
            >
            <Input type="textarea" placeholder='Please enter a new name for this file/folder.'/>
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
