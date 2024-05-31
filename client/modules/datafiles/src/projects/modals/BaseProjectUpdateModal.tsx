import { BaseProjectForm } from '../forms/BaseProjectForm';

import React, { useState } from 'react';
import { TModalChildren } from '../../DatafilesModal/DatafilesModal';
import { Button, Modal, notification } from 'antd';
import { ChangeProjectTypeModal } from './ChangeProjectTypeModal';
import { usePatchProjectMetadata } from '@client/hooks';

export const BaseProjectUpdateModal: React.FC<{
  projectId: string;
  children: TModalChildren;
}> = ({ projectId, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { mutate } = usePatchProjectMetadata(projectId);
  const [notifApi, contextHolder] = notification.useNotification();

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  const changeTypeModal = (
    <ChangeProjectTypeModal projectId={projectId}>
      {({ onClick }) => (
        <Button
          onClick={(evt) => {
            handleClose();
            onClick(evt);
          }}
          type="link"
        >
          <strong>Change Project Type</strong>
        </Button>
      )}
    </ChangeProjectTypeModal>
  );

  const onSubmit = (v: Record<string, unknown>) => {
    handleClose();
    mutate(
      { patchMetadata: v },
      {
        onSuccess: () =>
          notifApi.open({
            type: 'success',
            message: '',
            description: 'Your project was successfully updated.',
            placement: 'bottomLeft',
          }),
        onError: () =>
          notifApi.open({
            type: 'error',
            message: 'Error!',
            description: 'There was an error updating your project.',
            placement: 'bottomLeft',
          }),
      }
    );
  };

  return (
    <>
      {contextHolder}
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width="900px"
        title={<h2>Editing Project {projectId}</h2>}
        footer={null}
      >
        <article>
          <BaseProjectForm
            projectId={projectId}
            onSubmit={onSubmit}
            changeTypeModal={changeTypeModal}
          />
        </article>
      </Modal>
    </>
  );
};
