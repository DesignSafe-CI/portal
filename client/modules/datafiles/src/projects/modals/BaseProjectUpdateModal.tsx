import { BaseProjectForm } from '../forms/BaseProjectForm';

import React, { useState } from 'react';
import { TModalChildren } from '../../DatafilesModal/DatafilesModal';
import { Modal } from 'antd';

export const BaseProjectUpdateModal: React.FC<{
  projectId: string;
  children: TModalChildren;
}> = ({ projectId, children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {React.createElement(children, { onClick: showModal })}
      <Modal
        open={isModalOpen}
        onCancel={handleClose}
        width="900px"
        title={<h2>Editing Project {projectId}</h2>}
        footer={null}
      >
        <article>
          <BaseProjectForm projectId={projectId} onChangeType={handleClose} />
        </article>
      </Modal>
    </>
  );
};
