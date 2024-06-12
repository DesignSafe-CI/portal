import { BaseProjectCreateForm } from '../forms/CreateProjectForm';
import React, { useState } from 'react';
import { TModalChildren } from '../../DatafilesModal/DatafilesModal';
import { Modal, notification } from 'antd';
import { useCreateProject } from '@client/hooks';
import { useNavigate } from 'react-router-dom';

export const BaseProjectCreateModal: React.FC<{
  children: TModalChildren;
}> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [notifApi, contextHolder] = notification.useNotification();

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  const { mutate } = useCreateProject();
  const navigate = useNavigate();

  const onSubmit = (v: Record<string, unknown>) => {
    mutate(
      { projectValue: v },
      {
        onSuccess: () => {
          navigate('projects');
          notifApi.open({
            type: 'success',
            message: '',
            description: 'Your project was successfully created.',
            placement: 'bottomLeft',
          });
        },
        onError: () =>
          notifApi.open({
            type: 'error',
            message: 'Error!',
            description: 'There was an error creating your project.',
            placement: 'bottomLeft',
          }),
      }
    );
    handleClose();
  };

  return (
    <>
      {contextHolder}
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width="900px"
        title={<h2>Create a New Project</h2>}
        footer={null}
      >
        <article>
          <BaseProjectCreateForm onSubmit={onSubmit} />
        </article>
      </Modal>
    </>
  );
};
